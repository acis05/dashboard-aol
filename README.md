# Your AOL Dashboard — Railway OAuth MVP

Dashboard read-only untuk Accurate Online menggunakan OAuth 2.0 Authorization Code.

## Deploy ke Railway
1. Upload seluruh isi project ini ke repository GitHub.
2. Railway → New Project → Deploy from GitHub Repo.
3. Setelah Railway memberi domain publik, salin domain tersebut.
4. Di Accurate Online Developer, set **OAuth Callback URL** menjadi:
   `https://DOMAIN-RAILWAY-ANDA/api/oauth/callback`
5. Di Railway → Variables isi:
   - `ACCURATE_CLIENT_ID`
   - `ACCURATE_CLIENT_SECRET`
   - `ACCURATE_REDIRECT_URI` = URL callback yang sama persis
   - `ACCURATE_SCOPE` = `glaccount_view journal_voucher_view`
   - `APP_SECRET` = string acak panjang
   - `MAX_JOURNALS_PER_LOAD` = `250`
6. Redeploy.
7. Buka aplikasi → klik **Connect Accurate Online** → login Accurate → Beri Akses → pilih database.

## Penting
`account.accurate.id` adalah host untuk OAuth, db-list, dan open-db. Setelah open-db, Accurate mengembalikan `host` dan `session` untuk database yang dipilih. Aplikasi menyimpan keduanya otomatis dan memanggil data API lewat `<host>/accurate/api/...`.

## Grafik
Setiap grafik memiliki filter tanggalnya sendiri:
- Total Omzet per Bulan
- Laba Rugi per Bulan
- Biaya per Bulan + multi-select akun biaya

## MVP
Versi ini membaca jurnal langsung dari Accurate dan membatasi jumlah jurnal per load. Untuk data besar, versi berikutnya sebaiknya memakai PostgreSQL + incremental sync.
