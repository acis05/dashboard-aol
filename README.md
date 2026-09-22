# AOL Insight v5.1 v5

**Custom Insights from Accurate Online**

Aplikasi dashboard web untuk membaca data Accurate Online melalui OAuth dan menampilkan insight keuangan dalam grafik yang lebih fleksibel.

## Fitur MVP

- Login aplikasi menggunakan email + password
- Admin dapat membuat user aplikasi
- OAuth Accurate Online
- Pilih database Accurate setelah OAuth
- Grafik omzet per bulan
- Grafik biaya per bulan + pilihan akun biaya
- Grafik laba rugi per bulan
- Filter tanggal terpisah pada setiap grafik
- Branding AOL Insight
- Siap deploy ke Railway

## Deploy ke Railway

1. Upload semua isi project ini ke repository GitHub.
2. Di Railway, buat **New Project → Deploy from GitHub Repo**.
3. Tambahkan service **PostgreSQL** di project Railway yang sama.
4. Pastikan service aplikasi mendapatkan `DATABASE_URL` dari PostgreSQL.
5. Tambahkan Variables berikut pada service aplikasi:

```env
APP_URL=https://DOMAIN-RAILWAY-ANDA.up.railway.app

DATABASE_URL=${{Postgres.DATABASE_URL}}

ADMIN_EMAIL=admin@perusahaan.com
ADMIN_PASSWORD=GANTI_PASSWORD_ADMIN_YANG_KUAT

APP_SECRET=GANTI_DENGAN_STRING_RANDOM_MINIMAL_32_KARAKTER

ACCURATE_CLIENT_ID=CLIENT_ID_DARI_ACCURATE_DEVELOPER
ACCURATE_CLIENT_SECRET=CLIENT_SECRET_DARI_ACCURATE_DEVELOPER
ACCURATE_REDIRECT_URI=https://DOMAIN-RAILWAY-ANDA.up.railway.app/api/oauth/callback
ACCURATE_SCOPE=glaccount_view journal_voucher_view

MAX_JOURNALS_PER_LOAD=1000
```

> Nama service PostgreSQL di Railway bisa berbeda. Jika variable reference `${{Postgres.DATABASE_URL}}` tidak cocok, gunakan menu **Add Reference** pada Variables dan pilih `DATABASE_URL` dari service PostgreSQL Anda.

## Callback OAuth Accurate

Setelah Railway memberikan domain publik, misalnya:

```text
https://aol-insight-production.up.railway.app
```

maka isi callback URL di Accurate Developer dengan tepat:

```text
https://aol-insight-production.up.railway.app/api/oauth/callback
```

Nilai yang sama harus digunakan untuk `ACCURATE_REDIRECT_URI` di Railway.

## Login admin pertama

Saat database user masih kosong, akun admin pertama akan dibuat otomatis dari:

```env
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Setelah berhasil login, admin dapat membuat user lain melalui menu **Kelola User**.

## Flow aplikasi

```text
Login AOL Insight
  → Koneksi Accurate
  → OAuth Accurate Online
  → Pilih database Accurate
  → Dashboard / grafik
```

## Catatan keamanan

Jangan membagikan `ACCURATE_CLIENT_SECRET`, `APP_SECRET`, `ADMIN_PASSWORD`, token OAuth, atau `DATABASE_URL` ke chat publik atau repository GitHub. Simpan semuanya hanya di Railway Variables.


## Fix OAuth redirect Railway

Versi 5.1 memperbaiki redirect setelah callback OAuth agar tidak kembali ke `localhost`.
Pastikan `APP_URL` berisi domain publik Railway tanpa slash di akhir, misalnya:

```env
APP_URL=https://aol-insight-production.up.railway.app
ACCURATE_REDIRECT_URI=https://aol-insight-production.up.railway.app/api/oauth/callback
```

Nilai callback yang sama harus didaftarkan di Accurate Developer.

## v5.2 - Perbaikan pembacaan detail jurnal Accurate
Response `journal-voucher/detail.do` Accurate menaruh nomor akun dan tipe akun di object `glAccount`, bukan pada field `accountNo` langsung. v5.2 membaca `glAccount.no`, `glAccount.accountType`, `accountNoRef`, `debitAmount`, `creditAmount`, dan `amountType`.

Untuk tes mapper setelah deploy:
`/api/diagnostics/journal-mapped?id=400`

Jika benar, response akan menampilkan lineCount > 0 dan baris seperti REVENUE / COGS.


## v5.3
- Grafik omzet diubah menjadi grafik batang.
- Grafik laba rugi diubah menjadi grafik batang.
- Halaman biaya menampilkan grafik batang bulanan + pie chart komposisi biaya.
- Rekomendasi `MAX_JOURNALS_PER_LOAD=1000` untuk tahap awal.
