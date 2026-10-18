# Kasir

Aplikasi kasir (POS) ringan untuk toko kecil. Mobile first, SvelteKit + Supabase, dengan asisten Telegram.

- **Transaksi**: ketuk barang untuk menjual, riwayat bisa dilihat dan diubah.
- **Stok**: harga beli + untung otomatis menghitung harga jual. Mendukung jual saldo e-money.
- **Keuangan**: untung, pemasukan, grafik tren per hari, barang paling untung, saran belanja.
- **Pengaturan**: nama toko, aturan e-money, daftar nomor HP yang boleh memakai Telegram, ganti kata sandi.
- Login nama pengguna + kata sandi saja (tanpa peran).

## Varian

Barang yang harganya beda (Es / Hangat, Kecil / Besar) dibuat sebagai barang bernama sama dengan varian berbeda. Tiap varian punya harga beli dan untung sendiri, tetapi stoknya dipakai bersama: jual Kopi Es atau Kopi Hangat sama-sama mengurangi satu stok Kopi. Di layar jual, barang bernama sama digabung jadi satu kotak; ketuk untuk memilih varian. Di Telegram cukup bilang "jual 2 kopi es"; kalau hanya "kopi", bot menanyakan variannya.

**Database yang sudah dibuat sebelumnya:** jalankan ulang seluruh `supabase/schema.sql` di SQL Editor (aman diulang). Ini menambah kolom `variant`, memperbarui fungsi transaksi, dan menyamakan stok varian yang sudah ada (diambil angka terbesar).

## Barang pendukung dan pengeluaran

- Barang dengan **harga jual Rp 0** (sedotan, cup, es batu) dicatat sebagai barang pendukung: stoknya berkurang saat dipakai di transaksi, tidak dihitung sebagai pemasukan, dan modalnya mengurangi untung. Isi harga beli per satuan pakai.
- **Pengeluaran lain-lain** (biaya keamanan, listrik, dll) dicatat di menu Keuangan, atau lewat Telegram. Untung bersih = untung jualan dikurangi pengeluaran. Tabel `expenses` ditambahkan oleh `schema.sql` (jalankan ulang).

## Aturan saldo e-money

Untung Rp 3.500 dihitung tiap kelipatan Rp 100.000 (dibulatkan ke atas). Biaya admin Rp 1.500 **flat**: hanya sekali per transaksi, berapa pun nominalnya. Di Pengaturan bisa diganti ke "Per kelipatan" (admin dikali jumlah kelipatan, seperti 200rb = Rp 10.000, 220rb = Rp 15.000).

| Nominal | Biaya yang dibayar pelanggan |
| ------- | ---------------------------- |
| 100.000 | 5.000                        |
| 200.000 | 8.500                        |
| 220.000 | 12.000                       |

Angka-angka ini bisa diubah di Pengaturan. Pemasukan toko dari saldo hanya biaya tersebut, nominal saldo tidak dihitung sebagai pemasukan.

## Menjalankan

1. Di Supabase buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**.
2. Salin `.env.example` menjadi `.env`, isi nilainya (lihat di bawah).
3. `npm install`, lalu `npm run dev`.
4. Buka aplikasi. Kunjungan pertama menampilkan "Buat akun pertama". Akun itu yang dipakai seterusnya.

### Isi `.env`

| Variabel | Dari mana |
| --- | --- |
| `SUPABASE_URL` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Sama, kunci `service_role`. Rahasia, hanya dipakai di server. |
| `SESSION_SECRET` | Teks acak panjang (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `TELEGRAM_BOT_TOKEN` | Buat bot lewat @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Teks acak bebas (huruf, angka, `_`, `-`) |
| `AI_API_KEY` | Kunci API penyedia AI (default SumoPod: ai.sumopod.com > AI > API Keys) |
| `AI_BASE_URL`, `AI_MODEL` | Opsional. Default `https://ai.sumopod.com/v1` dan `deepseek-v4-flash`. Bisa diganti juga di Pengaturan. |

Semua tabel dikunci dengan RLS tanpa policy, jadi data hanya bisa diakses lewat server aplikasi.

## Asisten Telegram

1. Deploy aplikasi ke alamat **https** (Vercel, Netlify, dll; `adapter-auto` memilihnya otomatis) dan isi variabel di atas di dashboard hosting.
2. Buka **Pengaturan > Asisten Telegram**, tambah nomor HP yang diizinkan, lalu tekan **Sambungkan ke Telegram**.
3. Pengguna membuka bot, menekan Start, lalu **Bagikan nomor HP**. Nomor dari Telegram dicocokkan dengan daftar. Telegram hanya menyerahkan nomor milik akun itu sendiri, jadi tidak bisa dipalsukan.
4. Setelah cocok, tulis biasa: "jual 2 kopi dan 1 teh", "isi saldo DANA 220rb", "untung hari ini berapa?", "stok apa yang hampir habis?", "bawa apa saja besok?".

Kemampuan asisten: catat, lihat, ubah, dan hapus penjualan; tambah, lihat, ubah, hapus barang; untung per periode; tren per hari; saran belanja stok; saran isi tas. Penyedia AI apa pun yang kompatibel OpenAI (chat completions dengan tool calling) bisa dipakai: ganti alamat API dan model di Pengaturan, dan kunci di `.env`.

## Persetujuan sebelum data berubah

Asisten tidak hanya membaca: ia bisa menambah, mengubah, dan menghapus barang, penjualan, dan pengeluaran. Tetapi **setiap perubahan harus disetujui dulu**. Asisten hanya menyiapkan ringkasan ("Catat penjualan: Kopi - Es x2, total Rp 16.000"), lalu pengguna membalas **ya** atau **batal**. Persetujuan dicek oleh server, bukan oleh AI, dan kedaluwarsa setelah 10 menit. Di web, menyimpan perubahan dan menghapus transaksi juga meminta konfirmasi.

## Catatan teknis

- Hari dihitung menurut WIB (Asia/Jakarta).
- Barang yang "dihapus" hanya disembunyikan, supaya riwayat transaksi lama tetap utuh.
- Membuat dan mengubah transaksi berjalan atomik di database (`create_sale`, `update_sale`), termasuk pengurangan stok.
- Lupa kata sandi: ubah baris di tabel `app_users` (isi `password_hash` dengan hasil `hashPassword` di `src/lib/server/auth.ts`), atau hapus baris itu untuk membuat akun pertama lagi.
