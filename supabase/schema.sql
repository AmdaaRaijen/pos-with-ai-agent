-- Jalankan sekali di Supabase: SQL Editor > New query > paste > Run.
-- Semua akses lewat server (service role), jadi RLS dinyalakan tanpa policy
-- supaya tabel tidak bisa dibaca langsung dari browser.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'barang' check (kind in ('barang', 'emoney')),
  buy_price integer not null default 0 check (buy_price >= 0),
  sell_price integer not null default 0 check (sell_price >= 0),
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Varian (misal Es / Hangat). Boleh dijalankan ulang di database yang sudah ada.
alter table products add column if not exists variant text;
create unique index if not exists products_name_variant_uq
  on products (lower(name), lower(coalesce(variant, ''))) where active;

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  total integer not null default 0,     -- pemasukan toko (biaya admin untuk e-money)
  profit integer not null default 0,
  note text,
  source text not null default 'web'
);
-- false = rekap transaksi lama: tidak mengurangi (dan tidak mengembalikan) stok
alter table sales add column if not exists stock_applied boolean not null default true;
create index if not exists sales_created_idx on sales (created_at desc);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  kind text not null default 'barang',
  qty integer not null check (qty > 0),
  unit_price integer not null,          -- harga jual per satuan
  unit_cost integer not null,           -- modal per satuan
  nominal integer,                      -- khusus e-money: nominal saldo yang dikirim
  profit integer not null
);
create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists sale_items_product_idx on sale_items (product_id);

-- Pengeluaran lain-lain (biaya keamanan, listrik, dll). Mengurangi untung bersih.
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default ((now() at time zone 'Asia/Jakarta')::date),
  name text not null,
  amount integer not null check (amount > 0),
  source text not null default 'web',
  created_at timestamptz not null default now()
);
create index if not exists expenses_spent_idx on expenses (spent_on desc);
alter table expenses enable row level security;

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

insert into settings (key, value) values
  ('store', '{"name": "Toko Saya"}'),
  ('emoney', '{"admin": 1500}'),
  ('telegram_whitelist', '[]')
on conflict (key) do nothing;

create table if not exists telegram_links (
  chat_id bigint primary key,
  phone text not null,
  name text,
  history jsonb not null default '[]',
  linked_at timestamptz not null default now()
);
-- Perubahan data dari asisten menunggu persetujuan "ya" dari pengguna
alter table telegram_links add column if not exists pending jsonb;

alter table app_users enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table settings enable row level security;
alter table telegram_links enable row level security;

-- ---------------------------------------------------------------------------
-- Hitung satu baris transaksi dari JSON {product_id, qty, nominal?, paid?, unit_price?}
-- lalu simpan ke sale_items dan kurangi stok. Dipakai oleh create/update sale.
-- ---------------------------------------------------------------------------
-- Varian satu barang (nama sama) berbagi satu stok: ubah stok semua varian aktif bersamaan.
create or replace function _stock_delta(p_product uuid, p_delta int)
returns void language sql as $$
  update products set stock = stock + p_delta
  where id = p_product
     or (active and kind = 'barang'
         and lower(name) = (select lower(name) from products where id = p_product));
$$;

-- Samakan stok varian yang sudah ada sebelumnya (ambil angka terbesar).
update products p set stock = g.mx
from (select lower(name) n, max(stock) mx from products
      where active and kind = 'barang' group by 1 having count(*) > 1) g
where p.active and p.kind = 'barang' and lower(p.name) = g.n and p.stock <> g.mx;

create or replace function _apply_sale_items(p_sale uuid, p_items jsonb)
returns void language plpgsql as $$
declare
  it jsonb;
  prod products%rowtype;
  cfg jsonb;
  v_qty int;
  v_nominal int;
  v_paid int;
  v_price int;
  v_cost int;
  v_stock boolean;
begin
  select stock_applied into v_stock from sales where id = p_sale;
  select value into cfg from settings where key = 'emoney';
  cfg := coalesce(cfg, '{"admin": 1500}');

  for it in select * from jsonb_array_elements(p_items) loop
    -- kunci semua varian bernama sama supaya stok bersama tidak balapan
    perform 1 from products
      where kind = 'barang'
        and lower(name) = (select lower(name) from products where id = (it->>'product_id')::uuid)
      for update;
    select * into prod from products where id = (it->>'product_id')::uuid;
    if not found then
      raise exception 'Barang tidak ditemukan';
    end if;

    if prod.kind = 'emoney' then
      v_nominal := (it->>'nominal')::int;
      if v_nominal is null or v_nominal <= 0 then
        raise exception 'Nominal saldo harus diisi';
      end if;
      v_paid := (it->>'paid')::int;
      if v_paid is null or v_paid < v_nominal then
        raise exception 'Uang yang dibayar pembeli harus diisi';
      end if;
      v_qty := 1;
      -- biaya admin flat per transaksi (modal), harga = dibayar pembeli dikurangi saldo
      v_cost := (cfg->>'admin')::int;
      v_price := v_paid - v_nominal;
    else
      v_qty := (it->>'qty')::int;
      if v_qty is null or v_qty <= 0 then
        raise exception 'Jumlah harus lebih dari 0';
      end if;
      if v_stock and prod.stock < v_qty then
        raise exception 'Stok % tinggal %', prod.name || coalesce(' - ' || nullif(prod.variant, ''), ''), prod.stock;
      end if;
      v_nominal := null;
      v_price := coalesce((it->>'unit_price')::int, prod.sell_price);
      v_cost := prod.buy_price;
      if v_stock then perform _stock_delta(prod.id, -v_qty); end if;
    end if;

    insert into sale_items (sale_id, product_id, name, kind, qty, unit_price, unit_cost, nominal, profit)
    values (p_sale, prod.id, prod.name || coalesce(' - ' || nullif(prod.variant, ''), ''), prod.kind, v_qty, v_price, v_cost, v_nominal, (v_price - v_cost) * v_qty);
  end loop;

  update sales set
    total = coalesce((select sum(unit_price * qty) from sale_items where sale_id = p_sale), 0),
    profit = coalesce((select sum(profit) from sale_items where sale_id = p_sale), 0)
  where id = p_sale;
end $$;

drop function if exists create_sale(jsonb, text, text, timestamptz);
create or replace function create_sale(p_items jsonb, p_note text default null,
                                       p_source text default 'web', p_at timestamptz default now(),
                                       p_stock boolean default true)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Transaksi kosong';
  end if;
  insert into sales (note, source, created_at, stock_applied) values (p_note, p_source, p_at, p_stock) returning id into v_id;
  perform _apply_sale_items(v_id, p_items);
  return v_id;
end $$;

-- Ubah transaksi: kembalikan stok lama, ganti isi, kurangi stok baru.
create or replace function update_sale(p_id uuid, p_items jsonb, p_note text default null)
returns void language plpgsql as $$
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Transaksi kosong';
  end if;
  perform 1 from sales where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan'; end if;

  perform _stock_delta(product_id, qty)
  from sale_items
  where sale_id = p_id and kind = 'barang' and product_id is not null
    and (select stock_applied from sales where id = p_id);

  delete from sale_items where sale_id = p_id;
  update sales set note = p_note where id = p_id;
  perform _apply_sale_items(p_id, p_items);
end $$;

-- Hapus transaksi: kembalikan stok barang, lalu hapus transaksi beserta isinya.
create or replace function delete_sale(p_id uuid)
returns void language plpgsql as $$
begin
  perform 1 from sales where id = p_id for update;
  if not found then raise exception 'Transaksi tidak ditemukan'; end if;

  perform _stock_delta(product_id, qty)
  from sale_items
  where sale_id = p_id and kind = 'barang' and product_id is not null
    and (select stock_applied from sales where id = p_id);

  delete from sales where id = p_id;
end $$;

-- ---------------------------------------------------------------------------
-- Laporan (hari dihitung menurut WIB)
-- ---------------------------------------------------------------------------
drop function if exists daily_stats(date, date);
create function daily_stats(p_from date, p_to date)
returns table (day date, total bigint, profit bigint, trx bigint, expense bigint)
language sql stable as $$
  select d::date,
         coalesce(sum(s.total), 0)::bigint,
         coalesce(sum(s.profit), 0)::bigint,
         count(s.id)::bigint,
         (select coalesce(sum(e.amount), 0) from expenses e where e.spent_on = d::date)::bigint
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  left join sales s on (s.created_at at time zone 'Asia/Jakarta')::date = d::date
  group by d order by d;
$$;

create or replace function item_stats(p_from date, p_to date)
returns table (product_id uuid, name text, kind text, qty bigint, total bigint, profit bigint)
language sql stable as $$
  select i.product_id, i.name, i.kind,
         sum(i.qty)::bigint, sum(i.unit_price * i.qty)::bigint, sum(i.profit)::bigint
  from sale_items i join sales s on s.id = i.sale_id
  where (s.created_at at time zone 'Asia/Jakarta')::date between p_from and p_to
  group by i.product_id, i.name, i.kind
  order by sum(i.profit) desc;
$$;

-- Fungsi hanya boleh dipanggil dari server (service role).
revoke all on function _stock_delta(uuid, int) from public, anon, authenticated;
revoke all on function _apply_sale_items(uuid, jsonb) from public, anon, authenticated;
revoke all on function create_sale(jsonb, text, text, timestamptz) from public, anon, authenticated;
revoke all on function update_sale(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function delete_sale(uuid) from public, anon, authenticated;
revoke all on function daily_stats(date, date) from public, anon, authenticated;
revoke all on function item_stats(date, date) from public, anon, authenticated;
