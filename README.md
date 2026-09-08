# Berita Acara Serah Terima Sarana Administrasi NR

Aplikasi internal Seksi Bimas Islam — Kantor Kementerian Agama Kabupaten
Indramayu, untuk membuat & mengelola Berita Acara Serah Terima Sarana
Administrasi NR, dengan Google Spreadsheet lama sebagai database.

## Status: Tahap 3 dari 3 (inti selesai)

Update ini menambahkan **PDF resmi**, **Riwayat**, dan **arsip Google Drive**
untuk dokumen yang sudah ditandatangani. Semua halaman inti kini aktif.
Satu-satunya yang sengaja ditunda: **Edit** BA dari Riwayat (lihat bagian
paling bawah) — Lihat, Hapus, Download PDF, dan Unggah Arsip sudah jalan.

| Halaman | Status |
|---|---|
| Dashboard | ✅ Aktif |
| Pegawai | ✅ Aktif — CRUD + Kategori (Bimas Islam/KUA) + KUA Kecamatan |
| Pengaturan | ✅ Aktif — migrasi manual, format nomor surat, dll |
| Buat BA | ✅ Aktif — penomoran otomatis, validasi, simpan ke Master |
| Riwayat | ✅ Aktif — cari/filter/sort/pagination, Lihat, Hapus, Download PDF |
| PDF | ✅ Aktif — jsPDF + AutoTable, menyamai contoh dokumen |
| Arsip Drive | ✅ Aktif — unggah scan dokumen tertandatangan dari Riwayat |
| Edit BA | 🚧 Menyusul (Tahap 3b) |

## Struktur folder

```
project/
├── index.html          Shell aplikasi + 5 halaman
├── style.css            Tema (putih/abu muda/hijau Kemenag #0F7A3A)
├── script.js             Logika UI: navigasi, dashboard, CRUD Pegawai, Pengaturan, Buat BA, Riwayat
├── api.js                 Wrapper fetch ke Apps Script
├── pdf.js                  Generator PDF (jsPDF + AutoTable), dengan fallback multi-CDN
├── config.js               WEB_APP_URL — SATU-SATUNYA yang diubah saat setup di sisi frontend
├── logo-data.js            Logo kop surat sebagai base64 — lihat "Logo tidak muncul di PDF" di bawah
├── document-previewer.js   Komponen pratinjau PDF/gambar (dipakai untuk pratinjau arsip di Riwayat)
├── document-previewer.css  Style untuk document-previewer.js
├── assets/
│   ├── logo-kemenag.png    ⚠️ opsional — cukup untuk sumber assets/logo-converter.html, lihat di bawah
│   └── logo-converter.html Alat sekali-pakai: file logo -> logo-data.js
├── appscript/
│   ├── Code.gs             Backend Apps Script — SEMUA identifier (Spreadsheet ID, folder arsip Drive) ada di bagian KONFIGURASI paling atas file ini
│   └── appsscript.json     Manifest — WAJIB disalin juga, berisi izin (oauthScopes) untuk Drive
└── README.md               Berkas ini
```

## Cara menjalankan

1. **Deploy backend.** Buka Spreadsheet lama Anda → menu **Extensions >
   Apps Script**. Ini membuat script yang menempel langsung ke Spreadsheet
   (container-bound), jadi tidak perlu mengisi ID apa pun secara manual.
   Hapus isi `Code.gs` bawaan, tempel seluruh isi `appscript/Code.gs` dari
   project ini.
2. **Salin manifest.** Di editor Apps Script: ikon gerigi **Project Settings**
   → centang **"Show 'appsscript.json' manifest file in editor"**. Buka file
   `appsscript.json` yang muncul di sidebar editor, ganti isinya dengan isi
   `appscript/appsscript.json` dari project ini (berisi izin Spreadsheet +
   Drive yang dibutuhkan — lihat [Mengatasi error izin Google
   Drive](#mengatasi-error-izin-google-drive) kalau langkah ini terlewat).
3. **Deploy sebagai Web App.** **Deploy > New deployment** → tipe **Web
   app** → *Execute as:* **Me**, *Who has access:* **Anyone**. Salin URL
   yang diakhiri `/exec`.
4. **Sambungkan frontend.** Buka `config.js`, isi `WEB_APP_URL` dengan URL
   tadi. Itu saja — tidak ada field lain di `config.js`.
5. **(Opsional) Atur folder arsip Drive.** Kalau ingin arsip dokumen
   tertandatangan masuk ke folder Drive tertentu yang sudah Anda siapkan
   (bukan folder otomatis), buka `appscript/Code.gs`, isi konstanta
   `ARSIP_FOLDER_ID` di bagian **KONFIGURASI** paling atas dengan link atau
   ID folder tsb, lalu deploy ulang (**Deploy > Manage deployments > Edit
   (ikon pensil) > New version**). Boleh dikosongkan dan dilewati — nanti
   folder "Arsip Berita Acara NR" dibuat otomatis.
6. **Jalankan.** Buka `index.html` langsung di browser (double-click, atau
   *Open with Chrome*). Tidak perlu server tambahan.
7. Pada pemuatan pertama, aplikasi otomatis membuat sheet `PEGAWAI` &
   `SETTING` serta menjalankan migrasi awal dari `Master` — akan sedikit
   lebih lambat sekali saja, setelah itu normal.
8. **Logo:** buka `assets/logo-converter.html` di browser, pilih file logo
   Kemenag Anda, lalu unduh `logo-data.js` yang dihasilkan dan timpa file
   `logo-data.js` di folder utama project. Ini cara yang **disarankan** —
   lihat penjelasan lengkap di bagian [Logo tidak muncul di
   PDF](#logo-tidak-muncul-di-pdf) di bawah kalau ingin tahu alasannya.

### Jika fetch gagal / error CORS

Google Apps Script Web App tidak merespons *preflight* (`OPTIONS`) request,
jadi kode ini sengaja mengirim POST dengan `Content-Type: text/plain`
(bukan `application/json`) supaya browser tidak memicu preflight sama
sekali — sudah ditangani di `api.js`, tidak perlu diubah. Jika tetap
bermasalah, periksa lebih dulu:
- Deployment memakai akses **Anyone** (bukan dibatasi ke akun tertentu).
- URL yang dipakai diakhiri `/exec`, bukan `/dev`.
- Coba buka URL Web App langsung di tab baru dengan menambahkan
  `?action=getSetting` di belakangnya — harus muncul teks JSON, bukan
  halaman error/login Google.

### Mengatasi error izin Google Drive

Kalau muncul pesan soal Google Drive menolak akses (HTTP 401/403, mis.
*"insufficient authentication scopes"* atau *"permission to call
UrlFetchApp"*) saat Download PDF, Unggah Arsip, atau Pratinjau — ini
terjadi kalau Web App sudah pernah di-deploy & diotorisasi **sebelum**
fitur Drive (Tahap 3) ditambahkan, jadi izin yang tersimpan masih yang
lama. Cara memperbaiki:

1. Pastikan `appsscript.json` sudah disalin **persis** sesuai langkah 2 di
   atas (isinya harus punya 3 scope: `spreadsheets`, `drive`, dan
   `script.external_request`).
2. Di editor Apps Script, pilih fungsi **`authorizeDriveAccess`** dari
   dropdown "Select function" di toolbar, lalu klik **Run** (ikon ▷).
   Fungsi ini sekarang benar-benar mendiagnosis (bukan cuma mencoba lalu
   melapor gagal) — buka **Execution log** (ikon jam di sidebar editor)
   setelahnya, isinya akan menuliskan SATU PER SATU scope apa yang
   benar-benar melekat pada token otorisasi Anda saat ini, dan
   menyebutkan persis scope mana yang hilang kalau memang ada yang kurang.
3. **Kalau lognya bilang scope masih kurang padahal `appsscript.json`
   sudah benar** — ini gejala umum Apps Script: otorisasi yang sudah ada
   TIDAK otomatis diperbarui saat scope baru ditambahkan ke manifest;
   "izin lama" dianggap tetap berlaku padahal sudah tidak cukup. Perbaikan
   di titik ini **wajib manual**, menjalankan `authorizeDriveAccess()`
   berkali-kali TIDAK akan membantu tanpa langkah ini dulu:
   1. Buka **[myaccount.google.com/permissions](https://myaccount.google.com/permissions)**
      (harus login dengan akun yang sama yang men-deploy Web App ini).
   2. Cari nama project Apps Script ini (biasanya sama dengan nama
      Spreadsheet Anda, atau "Untitled project" kalau belum diganti).
   3. Klik masuk, lalu **"Remove Access"** / **"Hapus Akses"**.
   4. Kembali ke editor Apps Script, jalankan `authorizeDriveAccess()`
      lagi — kali ini Google **wajib** menampilkan layar persetujuan yang
      benar-benar baru (mungkin perlu klik "Advanced" > "Go to (nama
      project) (unsafe)" karena project belum diverifikasi Google — wajar
      untuk script pribadi/internal), mencakup SEMUA scope yang sekarang
      ada di `appsscript.json`.
4. Ulangi Langkah 2 untuk memastikan Execution log-nya sekarang
   menunjukkan "SEMUA BERHASIL, otorisasi lengkap" sebelum mencoba
   Unggah Arsip/Pratinjau lagi.

Kalau setelah semua ini errornya berubah jadi soal folder (HTTP 404,
bukan 401/403) — berarti otorisasinya sudah benar, tapi `ARSIP_FOLDER_ID`
di `appscript/Code.gs` berisi ID/link yang salah, atau foldernya tidak
dimiliki/belum di-share ke akun yang men-deploy Web App ini. Kosongkan
`ARSIP_FOLDER_ID` untuk memakai folder otomatis sebagai jalan pintas.

**Catatan teknis:** sejak update ini, semua panggilan Drive lewat REST API
v3 langsung via `UrlFetchApp` (bukan layanan `DriveApp` bawaan Apps
Script) — sesuai arahan langsung, dan supaya kode HTTP + pesan asli dari
Google selalu terlihat jelas di pesan error, bukan dibungkus pesan generik.

### Jika Download PDF gagal karena jsPDF tidak termuat

`pdf.js` mencoba memuat jsPDF & AutoTable dari **dua** CDN berbeda (cdnjs,
lalu jsdelivr sebagai cadangan) sebelum menyerah — jadi error ini hanya
muncul kalau jaringan yang dipakai memblokir keduanya. Kalau itu terjadi
di jaringan kantor, coba lewat jaringan lain (mis. hotspot HP) untuk
memastikan, atau minta admin IT mengizinkan `cdnjs.cloudflare.com` dan
`cdn.jsdelivr.net`.

### Logo tidak muncul di PDF

Percobaan sebelumnya (memuat `assets/logo-kemenag.png` saat runtime lewat
`fetch()`/`<img>`+canvas) ternyata tidak selalu berhasil. Sudah dikonfirmasi
persis kenapa: saat aplikasi dibuka lewat `file://`, Chrome (dan browser
Chromium lain) **selalu** memblokir `fetch()` ke file lokal apa pun dengan
CORS ("Cross origin requests are only supported for protocol schemes:
chrome, ... " — skema "file" memang tidak termasuk yang diizinkan sama
sekali, bukan soal pengaturan atau izin apa pun). `pdf.js` sekarang otomatis
melewati percobaan `fetch()` itu kalau mendeteksi sedang berjalan dari
`file://`, supaya tidak muncul error CORS yang memang sudah pasti gagal —
langsung lanjut ke cara `<img>`+canvas. Tapi cara itu pun bisa gagal di
sebagian browser (menganggap tiap URL `file://` sebagai origin unik,
sehingga `canvas.toDataURL()` gagal walau gambarnya tampil normal).

**Solusi yang disarankan (dan dijamin berhasil):** logo tidak lagi "dimuat"
sama sekali saat PDF dibuat — sudah jadi bagian dari kode lewat
`logo-data.js` (konstanta `LOGO_BASE64`), dihasilkan sekali lewat
`assets/logo-converter.html` (lihat langkah 8 di atas). Alat itu juga
otomatis memperkecil gambar ke maksimal 300px, jadi sekaligus menjawab
keluhan ukuran file logo yang kebesaran. Ini satu-satunya cara yang
selalu berhasil di semua browser.

### Pratinjau arsip (DocumentPreviewer)

Tombol "pratinjau" di modal Lihat Detail (Riwayat) memakai komponen
`document-previewer.js` yang sudah ada sebelumnya (dipakai juga di proyek
lain) — disalin apa adanya ke project ini, tidak dimodifikasi. Karena
Google Drive API tidak mengirim header CORS untuk endpoint unduh konten,
komponen ini **wajib** diberi `driveFetcher` kustom yang mengambil file
lewat backend sendiri (bukan mengandalkan API key + fetch langsung dari
browser, yang pasti gagal CORS) — sudah disambungkan di `script.js` ke
endpoint baru `getArsipFileContent` pada `Code.gs`, yang mengambil isi
file di sisi server (Apps Script tidak kena CORS) lewat REST API Drive
yang sama dengan yang dipakai untuk unggah. Butuh izin Drive yang sama
juga — kalau pratinjau gagal dengan error izin, ikuti langkah [Mengatasi
error izin Google Drive](#mengatasi-error-izin-google-drive) di atas.

## Temuan penting dari data asli

Sebelum menulis `Code.gs`, saya memeriksa langsung ke-69 baris data di
sheet `Master` (bukan hanya mengikuti daftar kolom di draf spesifikasi
awal), karena beberapa hal ternyata tidak sama dengan draf tersebut:

1. **Header "NIP" muncul 3×** (kolom I, O, AA), dan **"JABATAN"/"ALAMAT"
   masing-masing 2×** (kolom L/P, M/Q). Karena namanya identik, kolom
   *tidak bisa* dibaca dengan mencari nama header — `Code.gs` membacanya
   berdasarkan **posisi kolom** yang sudah dipetakan manual, dengan
   `validateMasterHeaders_()` memeriksa posisi-posisi kunci di setiap
   request supaya kalau strukturnya berubah suatu saat, prosesnya berhenti
   dengan pesan jelas — bukan diam-diam salah pasang data ke kolom keliru.

2. **Kolom H ("PHK  SATU NAMA") dan I ("NIP" pertama) selalu kosong** di
   seluruh data — ini kolom lama yang sudah digantikan kolom J ("PIHAK
   SATU") dan K ("NIP 2"). Sesuai aturan migrasi, kolom H & I **tidak
   disentuh sama sekali** (tidak dihapus/diubah), kode hanya membaca lewat
   J & K.

3. **"NOMOR PORPORASI 1"** menyimpan **rentang lengkap sebagai satu teks**
   (contoh: `115827401- 115827600`), bukan angka awal saja — "NOMOR
   PORPORASI 2" selalu kosong. Form Buat BA di Tahap 2 akan tetap punya
   input terpisah "Awal"/"Akhir" untuk kenyamanan mengetik, lalu digabung
   jadi satu teks dengan format yang sama saat disimpan.

4. **Kolom "NO. SERI"** (isi seperti `PS`, `JB`) ternyata field yang aktif
   dipakai sejak sekitar pertengahan Januari 2026, tapi **tidak disebut**
   di draf spesifikasi awal sama sekali. Dugaan awal saya (berdasarkan satu
   contoh dokumen yang menunjukkan kolom "SERI" kosong) bahwa ini kode
   batch internal yang tidak ikut tercetak, **ternyata keliru** — sesuai
   koreksi langsung dari pengguna, kolom "SERI" di PDF resmi memang mencetak
   isi "NO. SERI" ini. Sudah diperbaiki di `pdf.js`.

5. Ada beberapa baris lama dengan **kualitas data tidak rapi** — NIP
   kosong (baris 27), NIP dengan digit kelebihan/kekurangan (baris 23, 31),
   dan field tanggal yang "menyatu" (nama bulan + tahun tergabung di satu
   sel, misal baris 13–14, 21). `migrateDatabase()` tidak mencoba
   memperbaiki ini secara otomatis (berisiko salah tebak) — baris seperti
   ini dilewati dari sinkronisasi Pegawai dan dilaporkan sebagai
   **peringatan** (lihat tombol *Jalankan Migrasi/Sinkronisasi* di halaman
   Pengaturan), tanpa mengubah data asli di Master.

Silakan jalankan tombol migrasi di halaman Pengaturan dan periksa hasil +
daftar peringatannya — itu cara tercepat memverifikasi pemetaan di atas
benar terhadap Spreadsheet Anda yang sesungguhnya.

## Keputusan desain lain yang diambil

- **Pegawai dibedakan per Kategori: "Bimas Islam" (calon Pihak Pertama) dan
  "KUA" (calon Pihak Kedua).** Sheet PEGAWAI sekarang punya 6 kolom: `NIP,
  NAMA, KATEGORI, JABATAN, KUA, ALAMAT`. Field Jabatan di modal Tambah/Ubah
  Pegawai jadi *combobox* (boleh pilih dari daftar atau ketik manual) yang
  daftarnya menyesuaikan Kategori:
  - **Bimas Islam:** Kepala Seksi Bimas, Penyuluh Agama Kristen, Penyuluh
    Agama Katolik, JFU, JFT, Badan Penyelenggara Jaminan Produk Halal,
    Pengelola Pengadaan Barang dan Jasa.
  - **KUA:** Kepala KUA, Plt. Kepala KUA, Penghulu, Penyuluh Agama Islam,
    JFU, Pengadministrasi, Pengelola Umum Operasional, Penata Layanan
    Operasional, Operator Layanan Operasional, Operator KUA, Tenaga
    Administrasi, Staf KUA, Honorer.

  Untuk Kategori **KUA**, ada field tambahan **KUA Kecamatan** (dropdown 31
  KUA se-Kabupaten Indramayu) yang otomatis mengisi Alamat sesuai tabel
  resmi yang diberikan. Untuk Kategori **Bimas Islam**, Alamat otomatis
  disarankan "Jl. Olah Raga No. 03 Indramayu" (alamat kantor, sesuai data
  existing), tetap bisa diedit manual.

  **Migrasi data lama:** kolom Jabatan di sheet Master lama menyatukan
  jabatan & nama KUA dalam satu teks bebas (mis. "Penghulu KUA Patrol",
  "JFU KUA Kec.Bongas"). `migrateDatabase()` memisahkan keduanya secara
  best-effort (mencocokkan awalan teks ke daftar Jabatan resmi, dan
  substring ke daftar 31 KUA) — kalau tidak ada yang cocok, teks asli
  dipakai apa adanya (tidak dipaksakan ke daftar) supaya tidak ada data
  yang hilang; tinggal dirapikan manual lewat Ubah Pegawai bila perlu.
  Karena skema PEGAWAI berubah, jalankan **Pengaturan → Jalankan Migrasi/
  Sinkronisasi** sekali lagi setelah update ini (aman, sheet Master sama
  sekali tidak tersentuh).

- **"Mengetahui Kasi" via Pengaturan, bukan Pegawai.** Data Kasi di Master
  hanya berupa nama+NIP tanpa jabatan/alamat, jadi dropdown "Mengetahui"
  di Tahap 2 akan memakai `KASI_NAMA`/`KASI_NIP` dari sheet SETTING
  (sudah diisi default dari data existing: **H. Rosidi, S.Ag., MM** /
  `196812301994031003`), bukan dipaksakan masuk ke tabel Pegawai.
- **Migrasi bersifat upsert, bukan sekali jalan.** `migrateDatabase()` aman
  dipanggil berulang kali — menambah pegawai baru, memperbarui yang sudah
  ada (nama/jabatan/KUA/alamat mengikuti kemunculan terbaru di Master), dan
  tidak pernah menghapus baris Pegawai yang sudah ada atau menurunkan
  `LAST_NUMBER`.
- **`LAST_NUMBER` dilacak per tahun (`LAST_NUMBER_YEAR`)**, bukan maksimum
  global — penomoran surat lazim reset tiap tahun di lingkungan Kemenag.
  Saat ini sudah disesuaikan ke tahun 2026, nomor 69, sesuai data existing.
- **Format Nomor Surat dikendalikan penuh dari Pengaturan** (field "Format
  Nomor Surat"), lewat placeholder `{NOMOR}` `{KODE_KANTOR}` `{BULAN_ROMAWI}`
  `{KODE_KLASIFIKASI}` `{BULAN_ANGKA}` `{TAHUN}` — sesuai permintaan "format
  harus bisa diubah dari SETTING". Hanya KOMPONEN-nya (Nomor Urut, Bulan
  Surat, dst.) yang disimpan ke Master; string lengkapnya dirakit ulang
  setiap dibutuhkan (form Buat BA, nanti juga PDF), karena begitu pula cara
  data lama menyimpannya — kolom Master tidak punya field nomor lengkap.
- **Nomor Urut baru baru "dikonsumsi" saat Simpan berhasil**, bukan saat
  formulir dibuka — supaya membuka form Buat BA lalu berpindah halaman
  tanpa menyimpan tidak melompati satu nomor.
- **Kolom baru "LINK_ARSIP"** ditambahkan di Master (kolom ke-28) untuk
  menyimpan link Google Drive dokumen tertandatangan. Di seluruh data yang
  diperiksa, kolom ke-28 dan seterusnya selalu kosong tanpa header, jadi ini
  murni memberi nama pada kolom kosong yang sudah ada — bukan mengubah atau
  menggeser kolom lama mana pun. `ensureMasterArsipColumn_()` memeriksa ini
  otomatis tiap request dan berhenti dengan pesan jelas kalau ternyata
  kolom itu sudah dipakai untuk sesuatu yang lain.
- **Penempatan folder arsip diatur lewat konstanta `ARSIP_FOLDER_ID` di
  `appscript/Code.gs`** (bagian KONFIGURASI paling atas, satu tempat
  dengan `SPREADSHEET_ID`) — bukan lewat halaman Pengaturan, supaya semua
  identifier "sekali-set" terkumpul rapi di kode, bukan tersebar. Isi
  dengan link atau ID folder Drive yang sudah Anda siapkan sendiri (ini
  jadi folder DASAR); folder itu harus sudah bisa diakses akun yang
  men-deploy Web App ini. Kalau dikosongkan, aplikasi otomatis membuat/
  memakai folder "Arsip Berita Acara NR" sebagai dasarnya. **Sharing
  folder TIDAK diubah otomatis** oleh kode — kalau staf lain perlu membuka
  link arsip, share folder tsb manual sekali lewat Google Drive (klik
  kanan folder > Share), atau jalankan Apps Script-nya dari akun Google
  Workspace kantor yang sudah dipakai bersama.
- **Di dalam folder dasar itu, arsip diorganisir otomatis per Tahun >
  Bulan** (mis. `2026/09 - September/`, angka bulan di depan supaya urut
  kronologis saat dilihat di Drive, bukan alfabetis) — dibuat sesuai
  tanggal pelaksanaan BA-nya, bukan tanggal upload. Nama filenya
  `BAST KUA {nama KUA} - {nomor urut}-{tahun}.{ekstensi asli}`, mis.
  `BAST KUA Patrol - 069-2026.pdf` — nama KUA diambil dari data Pegawai
  Pihak Kedua saat itu (lihat [Kategori Pegawai](#) di atas).
- **Arsip yang sudah diunggah bisa dihapus atau diganti** dari modal Lihat
  Detail: tombol "hapus" menghapus file dari Drive + mengosongkan
  `LINK_ARSIP`; mengunggah file baru pada baris yang sudah punya arsip
  otomatis **menghapus dulu yang lama** sebelum menyimpan yang baru
  (replace, bukan menumpuk berkas lama yang tidak terpakai).
- **API Key Google Cloud (opsional) disimpan di `GOOGLE_DRIVE_API_KEY` pada
  `appscript/Code.gs`**, sengaja BUKAN di `config.js` sisi frontend, supaya
  tidak pernah ikut terkirim ke browser/terlihat di "View Source". Statusnya
  jujur: **tidak dipakai kode manapun saat ini**, karena semua akses Drive
  di project ini sudah lewat OAuth (`ScriptApp.getOAuthToken()`, lebih kuat
  & sudah mencakup semuanya) — hanya ditaruh di sini supaya tersimpan rapi
  di satu tempat kalau suatu saat dibutuhkan. `document-previewer.js`
  sendiri punya jalur fallback yang memakai API key ini langsung dari
  browser kalau `driveFetcher` kosong, tapi seperti sudah didokumentasikan
  di komentar "FIX #23" pada file itu sendiri, jalur itu **selalu gagal
  CORS** untuk mengambil isi file — karena itu, dan karena key ini sengaja
  tidak dikirim ke client sama sekali, pratinjau arsip tetap memakai
  `driveFetcher` (satu-satunya cara yang terbukti berhasil untuk kasus ini).
- **PDF butuh koneksi internet** saat pertama kali dibuka — jsPDF & jsPDF-
  AutoTable dimuat lewat CDN, dengan **fallback otomatis dua penyedia**
  (cdnjs lalu jsdelivr) kalau salah satu diblokir jaringan. Setelah
  termuat sekali, browser biasanya meng-cache-nya untuk pemakaian
  berikutnya.
- **Logo Kemenag**: `pdf.js` mencoba `fetch()` dulu (paling andal untuk
  file lokal), baru jatuh ke cara `<img>`+canvas kalau itu gagal — beberapa
  browser menganggap tiap URL `file://` sebagai origin unik sehingga
  canvas-nya "tainted" walau gambarnya tampil normal sebagai `<img>`, dan
  itu tadinya menyebabkan logo tidak muncul meski filenya ada. Ukurannya
  juga dibatasi ke kotak maks. 22×20mm (bukan lebar tetap), supaya file
  logo beresolusi tinggi/rasio tidak biasa tidak tercetak kebesaran. Kalau
  file `assets/logo-kemenag.png` belum ada, PDF tetap
  dibuat tanpa logo (tidak error).
- **Tabel Pegawai & Riwayat bisa diurutkan** dengan klik judul kolom (klik
  lagi untuk membalik arah) — berlaku di kolom manapun yang kursornya
  berubah jadi pointer saat dihover.
- **Tabel Data Sarana di PDF diganti total** dari struktur asli (satu baris,
  kolom terpisah per NA/DN/N/NB) menjadi **satu baris per komponen**
  (No, Komponen, Banyaknya {Pasang, Buku}, Seri, Nomor Porporasi, Ket),
  sesuai arahan langsung — komponen DN dihapus (tidak pernah dipakai di
  data manapun). Hanya komponen dengan nilai terisi yang mendapat baris
  (kalau cuma NA yang diisi, tabelnya 1 baris saja); Seri & Nomor Porporasi
  hanya dicetak di baris pertama (nilainya satu untuk seluruh BA, bukan
  per komponen); "Pasang" selalu "-" karena tidak ada satu pun komponen
  yang datanya terpisah pasang/buku.
- **Jabatan yang dicetak di PDF menyertakan unit kerjanya** — data Pegawai
  menyimpan Jabatan bersih ("JFU") terpisah dari Kategori/KUA (perlu untuk
  combobox & filter dropdown), tapi `pdf.js` merakitnya kembali khusus
  untuk dicetak: "JFU Pada Seksi Bimas Islam" untuk Pihak Pertama, "JFU
  Pada KUA {nama KUA}" untuk Pihak Kedua — persis format pada data lama.
  Data Pegawai yang tersimpan sendiri tidak berubah, ini murni cara cetak.

## Yang sengaja ditunda: Edit Berita Acara

Riwayat sudah punya Lihat, Hapus, Download PDF, dan Unggah Arsip — belum
termasuk **Edit** data BA yang sudah tersimpan (perlu menggunakan ulang
sebagian besar logika form Buat BA dalam mode edit, termasuk mengecualikan
baris itu sendiri dari pengecekan duplikat/tumpang-tindih porporasi;
`checkPorporasi()` di `Code.gs` sudah menerima parameter `excludeRowNum`
untuk ini, tinggal disambungkan ke UI). Beri tahu kalau ini prioritas
berikutnya, atau kalau ada penyesuaian lain dulu dari yang sudah berjalan.

## Perbaikan UX (dari masukan pengguna, setelah Tahap 3)

Lima temuan "kurang user friendly" berikut sudah diperbaiki:

1. **Pihak Kedua: pilih KUA dulu, baru pegawainya.** Dropdown "Pilih
   Pegawai" di kartu Pihak Kedua dulu langsung menampilkan SEMUA staf KUA
   lintas 31 kecamatan sekaligus. Sekarang dipecah dua langkah — dropdown
   "KUA Kecamatan" (`#ba-pihak-kedua-kua`, daftar tetap 31 KUA) dulu, baru
   dropdown "Pilih Pegawai" (`#ba-pihak-kedua`, mulai kosong+nonaktif)
   terisi staf KUA yang dipilih itu saja. Kalau KUA yang dipilih belum
   punya pegawai terdaftar, muncul catatan singkat + tombol "Tambah
   sekarang" (lihat poin 2). Pihak Pertama tidak diubah (staf Bimas Islam
   jauh lebih sedikit, tidak perlu dipersempit).

2. **Tambah pegawai baru tanpa pindah halaman.** Tombol "+ Tambah Pegawai
   Baru" ditambahkan di kartu Pihak Pertama & Pihak Kedua pada form Buat
   BA. Tombol ini membuka modal Pegawai yang sama seperti di halaman
   Pegawai, tapi dengan Kategori sudah dipilihkan & dikunci sesuai sisi
   yang sedang diisi (dan KUA ikut ter-prefill kalau di poin 1 sudah
   dipilih), supaya pegawai barunya dijamin muncul di sisi yang benar.
   Begitu disimpan, modal tertutup dan pegawai itu **langsung terpilih**
   di dropdown yang sesuai — isian form Buat BA lain (tanggal, porporasi,
   dst.) tidak tersentuh sama sekali karena tidak ada navigasi halaman.
   Implementasi: `_pegawaiModalContext` di `script.js` menyimpan konteks
   ini selama modal terbuka, dipakai oleh `applyPegawaiQuickAddSelection_()`
   setelah simpan sukses.

3. **Alamat Pihak Pertama & Kedua dicetak lengkap dengan Kecamatan +
   Kabupaten.** Banyak data Pegawai (terutama hasil migrasi Master lama)
   menyimpan Alamat versi pendek tanpa Kecamatan/Kabupaten. Daripada
   mencetak field Alamat itu apa adanya, `pdf.js` dan modal Detail Riwayat
   sekarang memanggil `resolveAlamatLengkapPihakSatu_()` /
   `resolveAlamatLengkapPihakKedua_()` (di `script.js`):
   - **Pihak Kedua** (staf KUA): diutamakan alamat RESMI dari `KUA_LIST`
     (sudah pasti lengkap, sama seperti yang dipakai auto-isi form Tambah
     Pegawai) berdasarkan KUA pegawainya — bukan teks Alamat lama yang
     tersimpan. Kalau pegawainya sudah terlanjur dihapus dari Pegawai,
     nama KUA ditebak dari teks Jabatan yang tersimpan di baris BA itu
     sendiri (cara yang sama seperti `inferJabatanKua_()` di `Code.gs`
     untuk membaca Master lama).
   - **Pihak Pertama** (staf Bimas Islam): kalau Alamat yang tersimpan
     belum menyebut Kecamatan+Kabupaten, dipakai setting BARU
     **ALAMAT_BIMAS_LENGKAP** (halaman Pengaturan) sebagai gantinya.
     Nilai defaultnya —
     *"Jl. Olah Raga No. 03, Kelurahan Karanganyar, Kecamatan Indramayu,
     Kabupaten Indramayu"* — sudah dicocokkan dengan alamat resmi di
     situs kemenagindramayu.com, tapi **tolong dicek ulang** di halaman
     Pengaturan siapa tahu kantornya sudah pindah; setting ini sengaja
     dibuat bisa diubah lewat UI, bukan konstanta tertanam, supaya tidak
     perlu edit kode kalau alamatnya berubah.

   Setting baru ini otomatis ter-seed untuk instalasi yang SUDAH berjalan
   lewat `ensureSettingDefaults_()` (dipanggil di `ensureBootstrapped_()`,
   `Code.gs`) — cukup refresh halaman, tidak perlu migrasi manual apa pun.
   Data Pegawai/Master itu sendiri tidak diubah oleh perbaikan ini —
   murni cara cetak/tampil.

4. **Modal Detail Riwayat menampilkan tempat kerja.** `#detail-ba-pihak-satu`
   dan `#detail-ba-pihak-kedua` sekarang punya baris tambahan "Tempat
   Kerja: Seksi Bimas Islam" / "Tempat Kerja: KUA Kecamatan {nama}",
   dari `getTempatKerjaLabel_()` di `script.js` — memakai penelusuran
   NIP yang sama seperti poin 3.

5. **Kolom KUA di tabel Riwayat.** `#page-riwayat` sekarang punya kolom
   "KUA" (bisa diurutkan, ikut kena kotak pencarian) di antara "Pihak
   Kedua" dan "Porporasi", plus dropdown filter "Semua KUA" di sebelah
   filter Tahun/Bulan yang sudah ada — supaya dari daftar saja sudah
   kelihatan BA itu untuk KUA mana, tanpa perlu buka Detail satu-satu.