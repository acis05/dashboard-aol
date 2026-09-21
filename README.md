# Your AOL Dashboard — Railway Simple

Versi percobaan yang sengaja dibuat **tanpa database** agar mudah dites. Dashboard membaca Accurate Online langsung dari server Next.js.

## Fitur

- Total omzet per bulan (`REVENUE`)
- Biaya per bulan (`EXPENSE` / `OTHER_EXPENSE`) dan pilihan akun
- Laba rugi per bulan (`REVENUE`, `COGS`, `EXPENSE`, `OTHER_INCOME`, `OTHER_EXPENSE`)
- Endpoint diagnostik supaya error dari Accurate gampang dilihat
- Logo Your AOL Dashboard yang sudah disetujui

## 1. Masukkan ke GitHub

1. Buat repository baru di GitHub, misalnya `your-aol-dashboard`.
2. Upload seluruh isi folder project ini ke repository (jangan upload zip-nya sebagai satu file; isi zip harus diekstrak dulu).
3. Pastikan `package.json` berada di root repository.

## 2. Deploy ke Railway

1. Login Railway.
2. **New Project → Deploy from GitHub Repo**.
3. Pilih repo `your-aol-dashboard`.
4. Railway akan mendeteksi Next.js dan menjalankan `npm run build` lalu `npm start`.
5. Di Railway buka **Variables**, isi:

```env
ACCURATE_API_HOST=https://HOST-ACCURATE-ANDA
ACCURATE_ACCESS_TOKEN=TOKEN-ANDA
ACCURATE_SESSION_ID=SESSION-ANDA
MAX_JOURNALS_PER_LOAD=200
```

`ACCURATE_SESSION_ID` boleh dikosongkan bila metode autentikasi Anda tidak memerlukannya. Token/session jangan pernah ditaruh di source code atau GitHub.

## 3. Tes koneksi paling sederhana

Setelah Railway memberi domain, buka:

```text
https://DOMAIN-RAILWAY-ANDA/api/diagnostics/accounts
```

Jika berhasil, akan keluar JSON dari `glaccount/list.do`.

Lalu tes:

```text
https://DOMAIN-RAILWAY-ANDA/api/diagnostics/journals
```

Kalau response jurnal memberikan `id`, tes detail jurnal:

```text
https://DOMAIN-RAILWAY-ANDA/api/diagnostics/journal-detail?id=ID_JURNAL
```

Kalau error, copy teks error/JSON response lalu kirim ke ChatGPT. Jangan kirim token/session.

## Catatan versi percobaan

Dashboard ini menarik `journal-voucher/detail.do` satu per satu (concurrency 4), jadi belum cocok untuk database besar. `MAX_JOURNALS_PER_LOAD` sengaja default 200 agar aman untuk tes awal.

Setelah response nyata Accurate sudah cocok, versi berikutnya sebaiknya memakai PostgreSQL + incremental sync agar jauh lebih cepat dan hemat API call.

## Railway security scan
This release pins Next.js to `15.3.8` to satisfy Railway's security scanner for the vulnerabilities reported against Next.js 15.3.2.
