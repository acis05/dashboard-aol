# Your AOL Dashboard v4

Versi ini siap untuk alur: **Login aplikasi → Koneksi Accurate OAuth → pilih database → grafik omzet/biaya/laba rugi**.

## Fitur
- Halaman login email + password
- Admin panel untuk membuat akun USER / ADMIN
- Password di-hash dengan scrypt, tidak disimpan sebagai plain text
- PostgreSQL untuk menyimpan user aplikasi
- OAuth 2.0 Accurate Online setelah user login
- Menu Koneksi Accurate
- Menu Omzet per Bulan + filter tanggal
- Menu Biaya per Bulan + filter tanggal + pilih akun biaya
- Menu Laba Rugi per Bulan + filter tanggal
- UI modern dengan logo Your AOL Dashboard

## Deploy ke Railway
1. Upload isi project ini ke GitHub.
2. Railway → New Project → Deploy from GitHub.
3. Tambahkan **PostgreSQL** di project Railway yang sama. Railway biasanya menyediakan `DATABASE_URL` otomatis ke service aplikasi; jika belum, referensikan variable PostgreSQL ke service aplikasi.
4. Isi Variables aplikasi:

```env
ADMIN_EMAIL=admin@perusahaan.com
ADMIN_PASSWORD=PASSWORD_ADMIN_ANDA
APP_SECRET=STRING_RANDOM_MINIMAL_32_KARAKTER

ACCURATE_CLIENT_ID=...
ACCURATE_CLIENT_SECRET=...
ACCURATE_REDIRECT_URI=https://DOMAIN-RAILWAY-ANDA/api/oauth/callback
ACCURATE_SCOPE=glaccount_view journal_voucher_view
MAX_JOURNALS_PER_LOAD=250
```

5. Di Accurate Developer, OAuth Callback URL harus sama persis dengan `ACCURATE_REDIRECT_URI`.
6. Redeploy.
7. Buka domain Railway → halaman pertama adalah Login.
8. Login menggunakan `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
9. Untuk membuat user lain: sidebar → **Kelola User**.
10. Untuk Accurate: sidebar → **Koneksi Accurate** → Connect Accurate Online → pilih database.

## Catatan admin pertama
Akun admin bootstrap dibuat otomatis saat proses login pertama jika belum ada user ber-role ADMIN di database. Setelah admin sudah ada, perubahan ADMIN_EMAIL / ADMIN_PASSWORD di environment tidak otomatis mengganti password admin lama.

## Jika ada error
Kirim screenshot/log Railway saja. Jangan kirim `ACCURATE_CLIENT_SECRET`, token OAuth, password admin, atau `DATABASE_URL`.
