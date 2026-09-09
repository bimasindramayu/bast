/**
 * Code.gs
 * ============================================================================
 * Backend Google Apps Script — Berita Acara Serah Terima Sarana Administrasi
 * NR, Seksi Bimas Islam, Kantor Kementerian Agama Kabupaten Indramayu.
 *
 * CARA DEPLOY
 *   1. Buka Spreadsheet lama Anda (yang memuat sheet "Master").
 *   2. Menu Extensions > Apps Script. Cara ini membuat script yang
 *      "menempel" langsung ke Spreadsheet (container-bound) — dengan begitu
 *      SpreadsheetApp.getActiveSpreadsheet() otomatis merujuk ke Spreadsheet
 *      yang benar, TANPA perlu mengisi SPREADSHEET_ID di bawah.
 *   3. Hapus isi Code.gs bawaan, tempel seluruh isi file ini.
 *   4. Deploy > New deployment > pilih tipe "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   5. Salin Web App URL (diakhiri /exec), tempel ke WEB_APP_URL di
 *      config.js pada folder utama project (BUKAN file ini).
 *
 * CATATAN PENTING TENTANG STRUKTUR SHEET "Master" — WAJIB DIBACA
 * ----------------------------------------------------------------------------
 * Pemetaan kolom di bawah ini diverifikasi langsung terhadap 69 baris data
 * asli di sheet Master, BUKAN sekadar disalin dari draf spesifikasi awal.
 * Ditemukan beberapa hal penting yang tidak terlihat dari nama kolom saja:
 *
 * 1. Header "NIP" muncul TIGA KALI (kolom I, O, AA), dan "JABATAN"/"ALAMAT"
 *    masing-masing DUA KALI (kolom L/P, M/Q). Karena namanya identik, kolom
 *    ini TIDAK BISA dicari berdasarkan teks header — harus berdasarkan
 *    POSISI. validateMasterHeaders_() memeriksa posisi-posisi kunci setiap
 *    kali sheet ini dibaca, supaya jika strukturnya berubah suatu saat,
 *    proses berhenti dengan pesan jelas — bukan diam-diam salah pasang data.
 *
 * 2. Kolom H ("PHK  SATU NAMA") dan I ("NIP" pertama) adalah kolom LAMA:
 *    di seluruh data yang diperiksa, keduanya SELALU KOSONG. Data Pihak
 *    Pertama yang sesungguhnya ada di kolom J ("PIHAK SATU") dan K
 *    ("NIP 2"). Kolom H & I tetap dipertahankan apa adanya (tidak dihapus/
 *    diubah), tapi kode ini membaca & menulis lewat J & K.
 *
 * 3. "NOMOR PORPORASI 1" (kolom X) menyimpan RENTANG LENGKAP sebagai satu
 *    teks, contoh "115827401- 115827600" — bukan hanya nomor awal. Kolom
 *    "NOMOR PORPORASI 2" (Y) selalu kosong di seluruh data yang diperiksa.
 *
 * 4. Kolom "NO. SERI" (W) berisi kode batch internal ("PS", "JB", dst.) —
 *    ini TIDAK muncul di PDF resmi (kolom "SERI" di PDF contoh selalu
 *    kosong, dan itu sebenarnya memetakan ke SERI 1/SERI 2 yang juga
 *    selalu kosong di data). "NO. SERI" sepertinya catatan batch internal.
 *
 * Jika struktur sheet Anda ternyata berbeda dari catatan ini, JANGAN ubah
 * nomor kolom di bawah secara manual — beri tahu dulu supaya bisa
 * disesuaikan dengan benar.
 * ============================================================================
 */

// ============================================================================
// KONFIGURASI  — semua identifier yang mungkin perlu diisi/diubah ada di
// SATU tempat ini saja, di paling atas file.
// ============================================================================

// Isi HANYA jika script ini dijalankan sebagai standalone script (bukan
// container-bound). Kosongkan jika mengikuti langkah deploy yang disarankan
// di kepala file ini — container-bound tidak butuh ini sama sekali.
const SPREADSHEET_ID = '';

// ID atau URL folder Google Drive tempat arsip dokumen tertandatangan
// disimpan (dipakai uploadArsip(), lihat bagian ARSIP GOOGLE DRIVE di bawah).
// Boleh diisi salah satu:
//   - ID mentah, mis. '1cFTUJd0HrNWXNXBil7GdQ9oWQ9Y1YauB'
//   - Link lengkap dari address bar Drive, mis.
//     'https://drive.google.com/drive/folders/1cFTUJd0HrNWXNXBil7GdQ9oWQ9Y1YauB?usp=drive_link'
// Folder tsb HARUS sudah bisa diakses oleh akun Google yang men-deploy Web
// App ini (dimiliki akun itu, atau sudah di-share ke akun itu) — kalau
// tidak, getOrCreateArchiveFolder_() akan melempar error yang menjelaskan
// ini. Kosongkan untuk membiarkan aplikasi membuat/memakai folder bernama
// "Arsip Berita Acara NR" secara otomatis.
const ARSIP_FOLDER_ID = '';

// API Key Google Cloud (opsional) — sengaja ditaruh DI SINI (server-side),
// BUKAN di config.js sisi frontend, supaya tidak pernah ikut terkirim ke
// browser/terlihat di "View Source" siapa pun yang membuka index.html.
// CATATAN JUJUR soal statusnya saat ini: seluruh akses Drive di file ini
// (unggah, cari folder, ambil isi file untuk pratinjau) sudah memakai
// OAuth token akun yang men-deploy Web App (ScriptApp.getOAuthToken(),
// lihat bagian ARSIP GOOGLE DRIVE) — itu lebih kuat daripada API key dan
// sudah mencakup semua yang dibutuhkan, jadi key di bawah ini TIDAK
// dipakai oleh kode manapun saat ini. Ditaruh di sini murni supaya
// tersimpan rapi di satu tempat kalau suatu saat dibutuhkan (bukan
// tersebar/hardcode di banyak tempat), TANPA membuka celah keamanan baru.
//
// Perlu diketahui: document-previewer.js sendiri punya jalur fallback yang
// memakai googleDriveApiKey langsung dari BROWSER (client-side) kalau
// driveFetcher tidak diisi — tapi seperti sudah didokumentasikan di
// komentar "FIX #23" pada file itu sendiri, jalur itu SELALU gagal CORS
// untuk mengambil ISI file (endpoint alt=media Drive API tidak mengirim
// header CORS sama sekali, terlepas dari API key-nya benar atau salah).
// Karena key ini sengaja tidak dikirim ke client sama sekali (itu tujuan
// keamanannya), jalur fallback itu tidak bisa dipakai dari sini — pratinjau
// arsip tetap memakai driveFetcher (lewat getArsipFileContent() di bawah),
// yang memang satu-satunya cara yang terbukti berhasil untuk kasus ini.
const GOOGLE_DRIVE_API_KEY = '';

const SHEET_MASTER = 'Master';
const SHEET_PEGAWAI = 'PEGAWAI';
const SHEET_SETTING = 'SETTING';

const BULAN_NAMES_ = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

// Kolom sheet Master, 1-indexed sesuai nomor kolom Spreadsheet (A=1, B=2, ...).
// Lihat catatan panjang di kepala file untuk alasan tiap pemetaan.
const MASTER_COL = {
  NMR_SRT: 1,
  NO_SURAT: 2,
  BLN_SRT: 3,
  HARI: 4,
  TGL: 5,
  BLN: 6,
  TAHUN: 7,
  // Kolom 8 & 9 (PHK SATU NAMA, NIP) = kolom lama, selalu kosong. Jangan dipakai.
  PIHAK_SATU_NAMA: 10,
  PIHAK_SATU_NIP: 11,
  PIHAK_SATU_JABATAN: 12,
  PIHAK_SATU_ALAMAT: 13,
  PIHAK_KEDUA_NAMA: 14,
  PIHAK_KEDUA_NIP: 15,
  PIHAK_KEDUA_JABATAN: 16,
  PIHAK_KEDUA_ALAMAT: 17,
  BANYAK_NA_BUKU: 18,
  BANYAK_N: 19,
  BANYAK_NB: 20,
  SERI_1: 21,             // selalu kosong di data yang diperiksa
  SERI_2: 22,             // selalu kosong di data yang diperiksa
  NO_SERI: 23,            // kode batch internal (PS/JB), tidak dicetak di PDF
  NOMOR_PORPORASI_1: 24,  // rentang lengkap sebagai teks, mis. "115827401- 115827600"
  NOMOR_PORPORASI_2: 25,  // selalu kosong di data yang diperiksa
  MENGETAHUI_KASI: 26,
  KASI_NIP: 27,
  LINK_ARSIP: 28,      // link Google Drive dokumen tertandatangan (lihat ensureMasterArsipColumn_)
  STATUS_SIMKAH: 29    // 'Sudah' / 'Belum' — lihat ensureMasterStatusSimkahColumn_ & updateStatusSimkah()
};

const PEGAWAI_COL = { NIP: 1, NAMA: 2, KATEGORI: 3, JABATAN: 4, KUA: 5, ALAMAT: 6 };
const SETTING_COL = { KEY: 1, VALUE: 2 };

// Dua sisi Berita Acara punya sumber pegawai berbeda: Pihak Pertama selalu
// staf Seksi Bimas Islam, Pihak Kedua selalu staf KUA Kecamatan — dipakai
// migrateDatabase() untuk mengklasifikasikan & membersihkan data Jabatan
// lama (lihat inferJabatanKategoriKua_), dan disalin persis dari daftar
// yang sama di script.js supaya konsisten.
const JABATAN_BIMAS_ = [
  'Kepala Seksi Bimas', 'Penyuluh Agama Kristen', 'Penyuluh Agama Katolik',
  'JFU', 'JFT', 'Badan Penyelenggara Jaminan Produk Halal', 'Pengelola Pengadaan Barang dan Jasa'
];
const JABATAN_KUA_ = [
  'Kepala KUA', 'Plt. Kepala KUA', 'Penghulu', 'Penyuluh Agama Islam', 'JFU',
  'Pengadministrasi', 'Pengelola Umum Operasional', 'Penata Layanan Operasional',
  'Operator Layanan Operasional', 'Operator KUA', 'Tenaga Administrasi', 'Staf KUA', 'Honorer'
];
const KUA_NAMES_ = [
  'Anjatan', 'Arahan', 'Balongan', 'Bangodua', 'Bongas', 'Cantigi', 'Cikedung', 'Gabuswetan',
  'Gantar', 'Haurgeulis', 'Indramayu', 'Jatibarang', 'Juntinyuat', 'Kandanghaur', 'Karangampel',
  'Kedokan Bunder', 'Kertasemaya', 'Krangkeng', 'Kroya', 'Lelea', 'Lohbener', 'Losarang',
  'Pasekan', 'Patrol', 'Sindang', 'Sliyeg', 'Sukagumiwang', 'Sukra', 'Terisi', 'Tukdana', 'Widasari'
];
// Alamat lengkap (menyertakan Kelurahan/Kecamatan/Kabupaten) sudah diverifikasi
// terhadap situs resmi kemenagindramayu.com — dipakai untuk mengisi Alamat
// pegawai Bimas Islam BARU secara default (lihat savePegawai/migrateDatabase
// di bawah). Untuk pegawai yang SUDAH ADA dengan Alamat versi lama/pendek,
// lihat setting ALAMAT_BIMAS_LENGKAP di DEFAULT_SETTINGS — itu yang dipakai
// sebagai fallback saat mencetak PDF (lihat resolveAlamatLengkapPihakSatu_ di
// script.js), supaya BA lama tidak perlu diedit satu per satu secara manual.
const ALAMAT_BIMAS_DEFAULT_ = 'Jl. Olah Raga No. 03, Kelurahan Karanganyar, Kecamatan Indramayu, Kabupaten Indramayu';

const DEFAULT_SETTINGS = {
  APP_NAME: 'Berita Acara Serah Terima Sarana Administrasi NR',
  DB_VERSION: '1.0',
  LAST_NUMBER: '0',
  LAST_NUMBER_YEAR: '',   // diisi runtime oleh migrateDatabase() dari data Master
  CREATED_AT: '',        // diisi runtime dengan waktu saat ini
  KASI_NAMA: 'H. Rosidi, S.Ag., MM',
  KASI_NIP: '196812301994031003',
  NOMOR_AWAL_SURAT: '1',
  KODE_KANTOR: 'Kk.10.12',
  KODE_KLASIFIKASI: 'PW.01',
  NOMOR_FORMAT_TEMPLATE: 'B.{NOMOR}/{KODE_KANTOR}/{BULAN_ROMAWI}/{KODE_KLASIFIKASI}/{BULAN_ANGKA}/{TAHUN}',
  TAHUN_AKTIF: '',        // diisi runtime dengan tahun berjalan
  // BARU — dipakai di PDF & detail Riwayat sebagai alamat Pihak Pertama kalau
  // Alamat pegawai yang tersimpan (banyak berasal dari migrasi data Master
  // lama) belum menyebutkan Kecamatan/Kabupaten. Diisi otomatis dengan nilai
  // resmi di atas, tapi tetap bisa diubah lewat halaman Pengaturan kalau
  // ternyata alamat kantornya berbeda/berpindah.
  ALAMAT_BIMAS_LENGKAP: ALAMAT_BIMAS_DEFAULT_
};

// ============================================================================
// ROUTER
// ============================================================================
function doGet(e) {
  const params = (e && e.parameter) || {};
  return routeRequest_(params.action, params);
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_(false, 'Body request tidak valid (bukan JSON yang bisa dibaca).');
  }
  return routeRequest_(body.action, body.payload || {});
}

function routeRequest_(action, params) {
  try {
    ensureBootstrapped_();
    switch (action) {
      case 'getDashboard':
        return jsonResponse_(true, '', getDashboard());
      case 'getPegawai':
        return jsonResponse_(true, '', getPegawai());
      case 'savePegawai':
        return jsonResponse_(true, 'Pegawai berhasil ditambahkan.', savePegawai(params));
      case 'updatePegawai':
        return jsonResponse_(true, 'Pegawai berhasil diperbarui.', updatePegawai(params));
      case 'deletePegawai':
        return jsonResponse_(true, 'Pegawai berhasil dihapus.', deletePegawai(params));
      case 'getSetting':
        return jsonResponse_(true, '', getSetting());
      case 'saveSetting':
        return jsonResponse_(true, 'Pengaturan berhasil disimpan.', saveSetting(params));
      case 'migrateDatabase':
        return jsonResponse_(true, 'Migrasi berhasil dijalankan.', migrateDatabase());
      case 'generateNomor':
        return jsonResponse_(true, '', generateNomor(params));
      case 'checkDuplicateNumber':
        return jsonResponse_(true, '', checkDuplicateNumber(params));
      case 'checkPorporasi':
        return jsonResponse_(true, '', checkPorporasi(params));
      case 'saveBeritaAcara':
        return jsonResponse_(true, 'Berita Acara berhasil disimpan.', saveBeritaAcara(params));
      case 'getBeritaAcara':
        return jsonResponse_(true, '', getBeritaAcara());
      case 'deleteBeritaAcara':
        return jsonResponse_(true, 'Berita Acara berhasil dihapus.', deleteBeritaAcara(params));
      case 'updateStatusSimkah':
        return jsonResponse_(true, 'Status SIMKAH berhasil diperbarui.', updateStatusSimkah(params));
      case 'uploadArsip':
        return jsonResponse_(true, 'Arsip berhasil diunggah.', uploadArsip(params));
      case 'getArsipFileContent':
        return jsonResponse_(true, '', getArsipFileContent(params));
      case 'deleteArsip':
        return jsonResponse_(true, 'Arsip berhasil dihapus.', deleteArsip(params));
      default:
        return jsonResponse_(false, 'Aksi tidak dikenal: "' + action + '".');
    }
  } catch (err) {
    return jsonResponse_(false, err.message);
  }
}

function jsonResponse_(success, message, data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: success,
      message: message || '',
      data: data === undefined ? null : data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// UTIL SPREADSHEET
// ============================================================================
function getSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  throw new Error('Spreadsheet tidak ditemukan. Jalankan script ini sebagai container-bound script (lihat catatan cara deploy di atas file ini), atau isi SPREADSHEET_ID.');
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan di Spreadsheet ini.');
  return sheet;
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeHeader_(value) {
  return String(value === undefined || value === null ? '' : value).trim().toUpperCase();
}

// Memeriksa posisi kolom kunci di header Master sebelum dibaca/ditulis.
// Jika struktur sheet berubah suatu saat, ini menghentikan proses dengan
// pesan jelas alih-alih diam-diam salah pasang data ke kolom yang salah.
function validateMasterHeaders_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), MASTER_COL.KASI_NIP);
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(normalizeHeader_);
  const expected = [
    [MASTER_COL.NMR_SRT, 'NMR SRT'],
    [MASTER_COL.PIHAK_SATU_NAMA, 'PIHAK SATU'],
    [MASTER_COL.PIHAK_SATU_NIP, 'NIP 2'],
    [MASTER_COL.PIHAK_KEDUA_NAMA, 'PHK KEDUA NAMA'],
    [MASTER_COL.BANYAK_NA_BUKU, 'BNYKNYA NA BUKU'],
    [MASTER_COL.BANYAK_N, 'BNYKNYA N'],
    [MASTER_COL.BANYAK_NB, 'BNYKNYA NB'],
    [MASTER_COL.NOMOR_PORPORASI_1, 'NOMOR PORPORASI 1'],
    [MASTER_COL.MENGETAHUI_KASI, 'MENGETAHUI KASI BIMAS']
  ];
  const mismatches = [];
  expected.forEach(function (pair) {
    const col = pair[0], expectedText = pair[1];
    const actual = header[col - 1] || '';
    if (actual.indexOf(expectedText) === -1) {
      mismatches.push('Kolom ke-' + col + ': diharapkan mengandung "' + expectedText + '", ditemukan "' + actual + '"');
    }
  });
  if (mismatches.length) {
    throw new Error(
      'Struktur header sheet Master tidak sesuai dengan yang diharapkan kode ini — proses dihentikan ' +
      'untuk mencegah salah baca data. Rincian:\n' + mismatches.join('\n')
    );
  }
}

// ============================================================================
// INISIALISASI & MIGRASI
// ============================================================================

// Dipanggil di awal SETIAP request. Kalau sheet PEGAWAI/SETTING belum ada
// (pemakaian pertama), otomatis menjalankan initializeDatabase() tanpa
// langkah manual terpisah — sesuai permintaan "migrasi otomatis saat
// pertama kali aplikasi dijalankan".
function ensureBootstrapped_() {
  const ss = getSpreadsheet_();
  const needsInit = !ss.getSheetByName(SHEET_PEGAWAI) || !ss.getSheetByName(SHEET_SETTING);
  if (needsInit) {
    initializeDatabase(); // sudah menyeed SEMUA DEFAULT_SETTINGS untuk sheet baru
  } else {
    ensureSettingDefaults_(); // sheet SETTING sudah ada dari sebelumnya -> pastikan key BARU tetap ter-seed
  }
  ensureMasterArsipColumn_();
  ensureMasterStatusSimkahColumn_();
}

// Menambahkan key SETTING yang mungkin baru ditambahkan pada versi aplikasi
// yang lebih baru (mis. ALAMAT_BIMAS_LENGKAP), TANPA menyentuh nilai yang
// sudah ada untuk key yang sudah ada sebelumnya. Aman dipanggil di setiap
// request (idempotent, hanya menulis kalau ada key yang benar-benar belum
// ada) — dipakai supaya deployment yang SUDAH berjalan sebelum sebuah key
// baru ditambahkan ke DEFAULT_SETTINGS tetap otomatis mendapat nilai
// default-nya (cukup refresh halaman), tanpa perlu menjalankan
// initializeDatabase() dari awal atau migrasi manual apa pun.
function ensureSettingDefaults_() {
  const sheet = getSheet_(SHEET_SETTING);
  const existing = readSettingSheet_(sheet);
  const missingKeys = Object.keys(DEFAULT_SETTINGS).filter(function (key) { return existing[key] === undefined; });
  if (!missingKeys.length) return;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // Baca ulang SETELAH dapat lock, supaya tidak menulis key ganda kalau ada
    // request lain yang sudah menyeed-nya duluan selagi menunggu lock ini.
    const freshExisting = readSettingSheet_(sheet);
    const toSeed = [];
    missingKeys.forEach(function (key) {
      if (freshExisting[key] !== undefined) return;
      let value = DEFAULT_SETTINGS[key];
      if (key === 'CREATED_AT' && !value) value = new Date().toISOString();
      if (key === 'TAHUN_AKTIF' && !value) value = String(new Date().getFullYear());
      toSeed.push([key, value]);
    });
    if (toSeed.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toSeed.length, 2).setValues(toSeed);
    }
  } finally {
    lock.releaseLock();
  }
}

// Kolom LINK_ARSIP (28) ditambahkan belakangan untuk fitur arsip Drive
// (Tahap 3). Di seluruh data yang diperiksa, kolom ke-28 dan seterusnya
// pada Master selalu kosong tanpa header — jadi ini AMAN diklaim sebagai
// kolom baru (bukan mengubah/menghapus kolom lama apa pun). Kalau ternyata
// kolom itu sudah dipakai untuk sesuatu yang lain, proses dihentikan
// dengan pesan jelas alih-alih menimpa begitu saja.
function ensureMasterArsipColumn_() {
  const sheet = getSheet_(SHEET_MASTER);
  const headerCell = sheet.getRange(1, MASTER_COL.LINK_ARSIP);
  const current = normalizeHeader_(headerCell.getValue());
  if (!current) {
    headerCell.setValue('LINK_ARSIP');
  } else if (current !== 'LINK_ARSIP') {
    throw new Error('Kolom ke-' + MASTER_COL.LINK_ARSIP + ' pada sheet Master sudah berisi header "' +
      current + '", bukan kosong — fitur arsip Drive tidak mengklaimnya secara otomatis. Beri tahu dulu supaya kolomnya disesuaikan.');
  }
}

// Sama seperti ensureMasterArsipColumn_() di atas, untuk kolom STATUS_SIMKAH
// (29) yang menandai apakah stok buku pada satu BA sudah dipindahkan/di-
// input ke SIMKAH atau belum. Baris-baris LAMA yang dibuat sebelum kolom
// ini ada otomatis terbaca 'Belum' oleh getBeritaAcara() (sel kosong ->
// default 'Belum'), TANPA fungsi ini perlu mengisi nilai apa pun ke baris
// yang sudah ada — cukup memastikan headernya terklaim untuk baris BARU.
function ensureMasterStatusSimkahColumn_() {
  const sheet = getSheet_(SHEET_MASTER);
  const headerCell = sheet.getRange(1, MASTER_COL.STATUS_SIMKAH);
  const current = normalizeHeader_(headerCell.getValue());
  if (!current) {
    headerCell.setValue('STATUS_SIMKAH');
  } else if (current !== 'STATUS_SIMKAH') {
    throw new Error('Kolom ke-' + MASTER_COL.STATUS_SIMKAH + ' pada sheet Master sudah berisi header "' +
      current + '", bukan kosong — fitur status SIMKAH tidak mengklaimnya secara otomatis. Beri tahu dulu supaya kolomnya disesuaikan.');
  }
}

function initializeDatabase() {
  getOrCreateSheet_(SHEET_PEGAWAI, ['NIP', 'NAMA', 'KATEGORI', 'JABATAN', 'KUA', 'ALAMAT']);
  const settingSheet = getOrCreateSheet_(SHEET_SETTING, ['KEY', 'VALUE']);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const existing = readSettingSheet_(settingSheet);
    const toSeed = [];
    Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
      if (existing[key] === undefined) {
        let value = DEFAULT_SETTINGS[key];
        if (key === 'CREATED_AT' && !value) value = new Date().toISOString();
        if (key === 'TAHUN_AKTIF' && !value) value = String(new Date().getFullYear());
        toSeed.push([key, value]);
      }
    });
    if (toSeed.length) {
      settingSheet.getRange(settingSheet.getLastRow() + 1, 1, toSeed.length, 2).setValues(toSeed);
    }
  } finally {
    lock.releaseLock();
  }

  migrateDatabase();
  return { initialized: true };
}

/**
 * Membaca ulang seluruh sheet Master, meng-upsert sheet PEGAWAI (menambah
 * yang belum ada, memperbarui yang sudah ada), dan mengoreksi
 * LAST_NUMBER/LAST_NUMBER_YEAR. Aman dipanggil berulang kali: tidak pernah
 * menghapus baris PEGAWAI yang sudah ada (termasuk yang ditambah manual),
 * dan tidak pernah menurunkan LAST_NUMBER untuk tahun yang sama.
 *
 * LAST_NUMBER dilacak PER TAHUN (maxNomorByYear), bukan maksimum global —
 * penomoran surat di lingkungan Kemenag lazim reset tiap tahun berganti
 * (lihat generateNomor()), jadi yang relevan adalah nomor tertinggi pada
 * TAHUN TERBARU yang ditemukan di Master, bukan nomor tertinggi sepanjang
 * masa lintas tahun.
 */
function migrateDatabase() {
  const masterSheet = getSheet_(SHEET_MASTER);
  validateMasterHeaders_(masterSheet);

  const data = masterSheet.getDataRange().getValues();
  const warnings = [];
  const maxNomorByYear = {};

  // NIP -> {nama, jabatan, alamat}. Baris Master diasumsikan urut kronologis
  // (NMR SRT naik), jadi kemunculan PALING BAWAH untuk satu NIP dianggap
  // paling mutakhir dan itulah yang disimpan (jabatan/alamat bisa berubah
  // seiring waktu untuk pegawai yang sama).
  const latestByNip = {};

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowNum = r + 1;

    const nomor = parseInt(row[MASTER_COL.NMR_SRT - 1], 10);
    const tahunRow = String(row[MASTER_COL.TAHUN - 1] || '').trim();
    if (!isNaN(nomor) && tahunRow) {
      if (!maxNomorByYear[tahunRow] || nomor > maxNomorByYear[tahunRow]) {
        maxNomorByYear[tahunRow] = nomor;
      }
    }

    collectPihak_(row, MASTER_COL.PIHAK_SATU_NAMA, MASTER_COL.PIHAK_SATU_NIP,
      MASTER_COL.PIHAK_SATU_JABATAN, MASTER_COL.PIHAK_SATU_ALAMAT,
      'Bimas Islam', 'Pihak Pertama', rowNum, latestByNip, warnings);

    collectPihak_(row, MASTER_COL.PIHAK_KEDUA_NAMA, MASTER_COL.PIHAK_KEDUA_NIP,
      MASTER_COL.PIHAK_KEDUA_JABATAN, MASTER_COL.PIHAK_KEDUA_ALAMAT,
      'KUA', 'Pihak Kedua', rowNum, latestByNip, warnings);
  }

  const pegawaiSheet = getOrCreateSheet_(SHEET_PEGAWAI, ['NIP', 'NAMA', 'KATEGORI', 'JABATAN', 'KUA', 'ALAMAT']);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let added = 0, updated = 0;
  try {
    const pegawaiData = pegawaiSheet.getDataRange().getValues();
    const rowIndexByNip = {};
    for (let r = 1; r < pegawaiData.length; r++) {
      const nip = String(pegawaiData[r][PEGAWAI_COL.NIP - 1] || '').trim();
      if (nip) rowIndexByNip[nip] = r + 1;
    }

    const toAppend = [];
    Object.keys(latestByNip).forEach(function (nip) {
      const info = latestByNip[nip];
      if (rowIndexByNip[nip]) {
        pegawaiSheet.getRange(rowIndexByNip[nip], PEGAWAI_COL.NAMA, 1, 5)
          .setValues([[info.nama, info.kategori, info.jabatan, info.kua, info.alamat]]);
        updated++;
      } else {
        toAppend.push([nip, info.nama, info.kategori, info.jabatan, info.kua, info.alamat]);
        added++;
      }
    });
    if (toAppend.length) {
      pegawaiSheet.getRange(pegawaiSheet.getLastRow() + 1, 1, toAppend.length, 6).setValues(toAppend);
    }

    const settingSheet = getOrCreateSheet_(SHEET_SETTING, ['KEY', 'VALUE']);
    const currentSettings = readSettingSheet_(settingSheet);
    let finalLast = parseInt(currentSettings.LAST_NUMBER, 10) || 0;
    let finalYear = currentSettings.LAST_NUMBER_YEAR || '';

    const yearsFound = Object.keys(maxNomorByYear);
    if (yearsFound.length) {
      const latestYearInMaster = yearsFound.reduce(function (a, b) {
        return (parseInt(b, 10) > parseInt(a, 10)) ? b : a;
      });
      if (!finalYear || parseInt(latestYearInMaster, 10) > parseInt(finalYear, 10)) {
        // Master punya tahun yang lebih baru dari yang tersimpan — pindah mengikuti Master.
        finalYear = latestYearInMaster;
        finalLast = maxNomorByYear[latestYearInMaster];
      } else if (parseInt(latestYearInMaster, 10) === parseInt(finalYear, 10)) {
        // Tahun sama — ambil yang lebih besar saja, jangan pernah mundur.
        finalLast = Math.max(finalLast, maxNomorByYear[latestYearInMaster]);
      }
      // Jika tahun tersimpan justru LEBIH BARU dari yang ada di Master (mis. sudah
      // ada BA tersimpan lewat aplikasi untuk tahun berikutnya), biarkan apa adanya.
    }
    writeSettingValue_(settingSheet, 'LAST_NUMBER', String(finalLast));
    writeSettingValue_(settingSheet, 'LAST_NUMBER_YEAR', String(finalYear));

    return { added: added, updated: updated, lastNumber: finalLast, lastNumberYear: finalYear, warnings: warnings };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Data lama menyatukan jabatan & nama KUA dalam satu teks bebas, mis.
 * "Penghulu KUA Patrol" atau "JFU KUA Kec.Bongas". Fungsi ini memisahkan
 * keduanya secara best-effort: Jabatan diambil dari AWALAN teks yang cocok
 * dengan salah satu opsi resmi (opsi terpanjang menang bila lebih dari satu
 * cocok), dan nama KUA diambil dari kecocokan substring terhadap daftar 31
 * kecamatan. Kalau tidak ada yang cocok sama sekali, teks asli dipakai apa
 * adanya (tidak dipaksakan) — supaya data lama yang tidak baku tetap
 * terlihat & bisa dibetulkan manual lewat Ubah Pegawai, bukan hilang diam-diam.
 */
function inferJabatanKua_(rawText, jabatanOptions, kuaNames) {
  const upperText = rawText.toUpperCase();

  let matchedJabatan = '';
  jabatanOptions.forEach(function (opt) {
    if (upperText.indexOf(opt.toUpperCase()) === 0 && opt.length > matchedJabatan.length) {
      matchedJabatan = opt;
    }
  });

  let matchedKua = '';
  kuaNames.forEach(function (k) {
    if (upperText.indexOf(k.toUpperCase()) !== -1) matchedKua = k;
  });

  return { jabatan: matchedJabatan || rawText, kua: matchedKua };
}

function collectPihak_(row, colNama, colNip, colJabatan, colAlamat, kategori, label, rowNum, latestByNip, warnings) {
  const nama = String(row[colNama - 1] || '').trim();
  const nipRaw = String(row[colNip - 1] || '').trim();
  const jabatanRaw = String(row[colJabatan - 1] || '').trim();
  const alamat = String(row[colAlamat - 1] || '').trim();

  if (!nama && !nipRaw) return; // sisi ini memang kosong pada baris tsb (mis. baris kedua pada contoh dokumen)

  const nipDigits = nipRaw.replace(/\D/g, '');
  if (!nama || nipDigits.length < 18) {
    warnings.push('Baris ' + rowNum + ' (' + label + '): nama/NIP tidak lengkap atau tidak valid ("' +
      nama + '" / "' + nipRaw + '") — dilewati dari sinkronisasi Pegawai, data Master tidak diubah.');
    return;
  }

  const jabatanOptions = kategori === 'KUA' ? JABATAN_KUA_ : JABATAN_BIMAS_;
  const kuaNames = kategori === 'KUA' ? KUA_NAMES_ : [];
  const inferred = inferJabatanKua_(jabatanRaw, jabatanOptions, kuaNames);

  latestByNip[nipRaw] = {
    nama: nama,
    kategori: kategori,
    jabatan: inferred.jabatan,
    kua: inferred.kua,
    alamat: alamat || (kategori === 'Bimas Islam' ? ALAMAT_BIMAS_DEFAULT_ : '')
  };
}

function readSettingSheet_(sheet) {
  const data = sheet.getDataRange().getValues();
  const result = {};
  for (let r = 1; r < data.length; r++) {
    const key = String(data[r][SETTING_COL.KEY - 1] || '').trim();
    if (key) result[key] = data[r][SETTING_COL.VALUE - 1];
  }
  return result;
}

function writeSettingValue_(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][SETTING_COL.KEY - 1] || '').trim() === key) {
      sheet.getRange(r + 1, SETTING_COL.VALUE).setValue(value);
      return;
    }
  }
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 2).setValues([[key, value]]);
}

// ============================================================================
// DASHBOARD
// ============================================================================
function getDashboard() {
  const masterSheet = getSheet_(SHEET_MASTER);
  const data = masterSheet.getDataRange().getValues();
  const totalBA = Math.max(data.length - 1, 0);

  const now = new Date();
  const currentYear = String(now.getFullYear());
  let baBulanIni = 0;
  for (let r = 1; r < data.length; r++) {
    const bulanText = String(data[r][MASTER_COL.BLN - 1] || '').toUpperCase();
    const tahunText = String(data[r][MASTER_COL.TAHUN - 1] || '').trim();
    const bulanIndex = BULAN_NAMES_.findIndex(function (b) { return bulanText.indexOf(b) === 0; });
    // tahunText dicocokkan dulu; jika kosong (ada beberapa baris lama dengan
    // data tahun yang tidak terisi rapi), fallback memeriksa apakah tahun
    // berjalan tertulis di dalam teks BLN itu sendiri.
    const tahunCocok = tahunText === currentYear || bulanText.indexOf(currentYear) !== -1;
    if (bulanIndex === now.getMonth() && tahunCocok) baBulanIni++;
  }

  const pegawaiSheet = getSheet_(SHEET_PEGAWAI);
  const totalPegawai = Math.max(pegawaiSheet.getLastRow() - 1, 0);

  const settings = getSetting();

  return {
    totalBA: totalBA,
    totalPegawai: totalPegawai,
    baBulanIni: baBulanIni,
    nomorTerakhir: settings.LAST_NUMBER || '0'
  };
}

// ============================================================================
// PEGAWAI (CRUD)
// ============================================================================
function getPegawai() {
  const sheet = getSheet_(SHEET_PEGAWAI);
  const data = sheet.getDataRange().getValues();
  const result = [];
  for (let r = 1; r < data.length; r++) {
    const nip = String(data[r][PEGAWAI_COL.NIP - 1] || '').trim();
    if (!nip) continue;
    result.push({
      nip: nip,
      nama: data[r][PEGAWAI_COL.NAMA - 1],
      kategori: data[r][PEGAWAI_COL.KATEGORI - 1],
      jabatan: data[r][PEGAWAI_COL.JABATAN - 1],
      kua: data[r][PEGAWAI_COL.KUA - 1],
      alamat: data[r][PEGAWAI_COL.ALAMAT - 1]
    });
  }
  return result;
}

function findPegawaiRow_(sheet, nip) {
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][PEGAWAI_COL.NIP - 1] || '').trim() === nip) return r + 1;
  }
  return -1;
}

function validatePegawaiPayload_(payload) {
  const nip = String(payload.nip || '').trim();
  const nama = String(payload.nama || '').trim();
  const kategori = String(payload.kategori || '').trim();
  const kua = String(payload.kua || '').trim();
  const jabatan = String(payload.jabatan || '').trim();
  const alamat = String(payload.alamat || '').trim();

  if (nip.replace(/\D/g, '').length < 18) throw new Error('NIP minimal 18 digit.');
  if (!nama || !jabatan || !alamat) throw new Error('Nama, Jabatan, dan Alamat wajib diisi.');
  if (kategori !== 'Bimas Islam' && kategori !== 'KUA') {
    throw new Error('Kategori wajib dipilih (Staf Bimas Islam atau Staf KUA).');
  }
  if (kategori === 'KUA' && !kua) throw new Error('KUA Kecamatan wajib dipilih untuk kategori Staf KUA.');

  return { nip: nip, nama: nama, kategori: kategori, kua: kategori === 'KUA' ? kua : '', jabatan: jabatan, alamat: alamat };
}

function savePegawai(payload) {
  const p = validatePegawaiPayload_(payload);
  const sheet = getSheet_(SHEET_PEGAWAI);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (findPegawaiRow_(sheet, p.nip) !== -1) throw new Error('NIP ' + p.nip + ' sudah terdaftar.');
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 6).setValues([[p.nip, p.nama, p.kategori, p.jabatan, p.kua, p.alamat]]);
  } finally {
    lock.releaseLock();
  }
  return { nip: p.nip };
}

function updatePegawai(payload) {
  const originalNip = String(payload.originalNip || '').trim();
  const p = validatePegawaiPayload_(payload);

  const sheet = getSheet_(SHEET_PEGAWAI);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rowNum = findPegawaiRow_(sheet, originalNip);
    if (rowNum === -1) throw new Error('Data pegawai dengan NIP ' + originalNip + ' tidak ditemukan.');
    if (p.nip !== originalNip && findPegawaiRow_(sheet, p.nip) !== -1) {
      throw new Error('NIP ' + p.nip + ' sudah dipakai pegawai lain.');
    }
    sheet.getRange(rowNum, 1, 1, 6).setValues([[p.nip, p.nama, p.kategori, p.jabatan, p.kua, p.alamat]]);
  } finally {
    lock.releaseLock();
  }
  return { nip: p.nip };
}

function deletePegawai(payload) {
  const nip = String(payload.nip || '').trim();
  const sheet = getSheet_(SHEET_PEGAWAI);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rowNum = findPegawaiRow_(sheet, nip);
    if (rowNum === -1) throw new Error('Data pegawai dengan NIP ' + nip + ' tidak ditemukan.');
    sheet.deleteRow(rowNum);
  } finally {
    lock.releaseLock();
  }
  return { nip: nip };
}

// ============================================================================
// SETTING
// ============================================================================
function getSetting() {
  return readSettingSheet_(getSheet_(SHEET_SETTING));
}

function saveSetting(payload) {
  const settingsObj = payload.settings || {};
  const sheet = getSheet_(SHEET_SETTING);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    Object.keys(settingsObj).forEach(function (key) {
      writeSettingValue_(sheet, key, String(settingsObj[key]));
    });
  } finally {
    lock.releaseLock();
  }
  return getSetting();
}

// ============================================================================
// BUAT BERITA ACARA  (Tahap 2)
// ============================================================================

function pad3_(n) {
  return String(n).padStart(3, '0');
}

// Parser toleran spasi di sekitar tanda hubung, karena data lama punya
// format bervariasi ("115827401- 115827600" maupun "115400001 - 115400200").
function parsePorporasiRange_(text) {
  const match = String(text || '').match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return null;
  return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) };
}

function formatPorporasiRange_(start, end) {
  return start + '- ' + end; // mengikuti format paling umum di data lama
}

/**
 * Mengusulkan Nomor Urut berikutnya untuk tahun tertentu. HANYA membaca,
 * TIDAK mengubah LAST_NUMBER — nomor baru benar-benar "dipakai" hanya saat
 * saveBeritaAcara() berhasil menyimpan (supaya membuka form lalu batal
 * tidak melompati satu nomor).
 *
 * Penomoran mengikuti kebiasaan umum persuratan Kemenag: reset ke
 * NOMOR_AWAL_SURAT setiap tahun berganti; kalau tahun target masih sama
 * dengan LAST_NUMBER_YEAR tersimpan, lanjut dari LAST_NUMBER + 1.
 */
function generateNomor(params) {
  const settings = getSetting();
  const targetYear = String((params && params.tahun) || new Date().getFullYear());
  const lastNumberYear = settings.LAST_NUMBER_YEAR || '';
  const lastNumber = parseInt(settings.LAST_NUMBER, 10) || 0;
  const nomorAwal = parseInt(settings.NOMOR_AWAL_SURAT, 10) || 1;

  const nomorUrut = (lastNumberYear && targetYear === String(lastNumberYear))
    ? lastNumber + 1
    : nomorAwal;

  return { nomorUrut: nomorUrut, noSurat: pad3_(nomorUrut), tahun: targetYear };
}

// Dipakai bersama oleh checkDuplicateNumber, saveBeritaAcara, deleteBeritaAcara,
// dan uploadArsip supaya logikanya konsisten satu tempat. Mengembalikan nomor
// baris spreadsheet (1-indexed) atau -1 kalau tidak ketemu. Sengaja scan ulang
// tiap kali dipanggil (bukan simpan rowNum dari list sebelumnya) supaya tidak
// meleset kalau ada baris lain yang berubah di antara load Riwayat dan aksinya.
function findMasterRow_(nomorUrut, tahun) {
  const nomorUrutNum = parseInt(nomorUrut, 10);
  const tahunStr = String(tahun || '').trim();
  const masterSheet = getSheet_(SHEET_MASTER);
  const data = masterSheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    const rowNomor = parseInt(data[r][MASTER_COL.NMR_SRT - 1], 10);
    const rowTahun = String(data[r][MASTER_COL.TAHUN - 1] || '').trim();
    if (rowNomor === nomorUrutNum && rowTahun === tahunStr) return r + 1;
  }
  return -1;
}

function checkDuplicateNumber(params) {
  const nomorUrut = parseInt(params.nomorUrut, 10);
  const tahun = String(params.tahun || '').trim();
  if (isNaN(nomorUrut) || !tahun) throw new Error('Nomor Urut dan Tahun wajib diisi untuk memeriksa duplikasi.');
  const rowNum = findMasterRow_(nomorUrut, tahun);
  return { duplicate: rowNum !== -1, rowNum: rowNum };
}

/**
 * Memeriksa apakah rentang [awal, akhir] tumpang tindih dengan rentang
 * porporasi BA lain yang sudah tersimpan di Master. excludeRowNum dipakai
 * saat mengedit BA yang sudah ada (Tahap 3) supaya baris itu sendiri tidak
 * dianggap tumpang tindih dengan dirinya — untuk Buat BA baru (Tahap 2)
 * selalu diabaikan (tidak ada baris untuk dikecualikan).
 */
function checkPorporasi(params) {
  const awal = parseInt(params.awal, 10);
  const akhir = parseInt(params.akhir, 10);
  const excludeRowNum = parseInt(params.excludeRowNum, 10) || -1;
  if (isNaN(awal) || isNaN(akhir)) throw new Error('Nomor porporasi awal/akhir tidak valid.');
  if (akhir < awal) throw new Error('Nomor porporasi akhir tidak boleh lebih kecil dari awal.');

  const masterSheet = getSheet_(SHEET_MASTER);
  const data = masterSheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (r + 1 === excludeRowNum) continue;
    const range = parsePorporasiRange_(data[r][MASTER_COL.NOMOR_PORPORASI_1 - 1]);
    if (!range) continue;
    if (awal <= range.end && akhir >= range.start) {
      return {
        overlap: true,
        nomorSurat: String(data[r][MASTER_COL.NO_SURAT - 1] || ''),
        rentang: data[r][MASTER_COL.NOMOR_PORPORASI_1 - 1]
      };
    }
  }
  return { overlap: false };
}

/**
 * Menyimpan Berita Acara baru ke sheet Master (baris baru, sesuai aturan
 * "jangan buat database baru, jangan ubah struktur Master"). Validasi
 * duplikat & tumpang-tindih porporasi DIULANG di sini (bukan hanya
 * mengandalkan pengecekan langsung dari form) supaya tetap aman walau dua
 * orang menyimpan hampir bersamaan — seluruh baca-cek-tulis dilindungi
 * satu LockService yang sama.
 */
function saveBeritaAcara(payload) {
  const nomorUrut = parseInt(payload.nomorUrut, 10);
  const tahun = String(payload.tahun || '').trim();
  const blnSrt = String(payload.blnSrt || '').trim();
  const hari = String(payload.hari || '').trim();
  const tgl = String(payload.tgl || '').trim();
  const bln = String(payload.bln || '').trim();
  const pihakSatuNip = String(payload.pihakSatuNip || '').trim();
  const pihakKeduaNip = String(payload.pihakKeduaNip || '').trim();
  const banyakNaBuku = (payload.banyakNaBuku === '' || payload.banyakNaBuku === undefined) ? '' : parseInt(payload.banyakNaBuku, 10);
  const banyakN = (payload.banyakN === '' || payload.banyakN === undefined) ? '' : parseInt(payload.banyakN, 10);
  const banyakNb = (payload.banyakNb === '' || payload.banyakNb === undefined) ? '' : parseInt(payload.banyakNb, 10);
  const porporasiAwal = parseInt(payload.porporasiAwal, 10);
  const porporasiAkhir = parseInt(payload.porporasiAkhir, 10);
  const noSeri = String(payload.noSeri || '').trim();
  const kasiNama = String(payload.kasiNama || '').trim();
  const kasiNip = String(payload.kasiNip || '').trim();
  // Status pemindahan stok buku ke SIMKAH — defaultnya SELALU 'Belum' saat BA
  // baru dibuat (pemindahan ke SIMKAH lazimnya baru dilakukan belakangan,
  // terpisah dari waktu BA fisiknya dibuat), apa pun yang dikirim payload
  // selain persis 'Sudah' dianggap 'Belum'. Bisa diubah nanti dari Riwayat
  // lewat updateStatusSimkah().
  const statusSimkah = (String(payload.statusSimkah || '').trim() === 'Sudah') ? 'Sudah' : 'Belum';

  if (isNaN(nomorUrut) || !tahun) throw new Error('Nomor Urut dan Tahun wajib diisi.');
  if (!pihakSatuNip) throw new Error('Pihak Pertama wajib dipilih.');
  if (!pihakKeduaNip) throw new Error('Pihak Kedua wajib dipilih.');
  if (isNaN(porporasiAwal) || isNaN(porporasiAkhir)) throw new Error('Nomor porporasi awal/akhir wajib diisi dengan angka.');
  if (porporasiAkhir < porporasiAwal) throw new Error('Nomor porporasi akhir tidak boleh lebih kecil dari awal.');
  if (!kasiNama || !kasiNip) throw new Error('Data Kepala Seksi (Mengetahui) wajib diisi — periksa halaman Pengaturan.');

  const pegawaiList = getPegawai();
  const pihakSatu = pegawaiList.find(function (p) { return p.nip === pihakSatuNip; });
  const pihakKedua = pegawaiList.find(function (p) { return p.nip === pihakKeduaNip; });
  if (!pihakSatu) throw new Error('Pihak Pertama tidak ditemukan di data Pegawai (mungkin baru dihapus?). Muat ulang halaman.');
  if (!pihakKedua) throw new Error('Pihak Kedua tidak ditemukan di data Pegawai (mungkin baru dihapus?). Muat ulang halaman.');

  const masterSheet = getSheet_(SHEET_MASTER);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const dup = checkDuplicateNumber({ nomorUrut: nomorUrut, tahun: tahun });
    if (dup.duplicate) throw new Error('Nomor Urut ' + nomorUrut + ' untuk tahun ' + tahun + ' sudah dipakai. Muat ulang halaman untuk usulan nomor terbaru.');

    const overlapCheck = checkPorporasi({ awal: porporasiAwal, akhir: porporasiAkhir });
    if (overlapCheck.overlap) {
      throw new Error('Nomor porporasi sudah digunakan pada BA Nomor ' + overlapCheck.nomorSurat + ' (rentang ' + overlapCheck.rentang + ').');
    }

    const width = MASTER_COL.STATUS_SIMKAH;
    const rowArray = new Array(width).fill('');
    rowArray[MASTER_COL.NMR_SRT - 1] = nomorUrut;
    rowArray[MASTER_COL.NO_SURAT - 1] = pad3_(nomorUrut);
    rowArray[MASTER_COL.BLN_SRT - 1] = blnSrt;
    rowArray[MASTER_COL.HARI - 1] = hari;
    rowArray[MASTER_COL.TGL - 1] = tgl;
    rowArray[MASTER_COL.BLN - 1] = bln;
    rowArray[MASTER_COL.TAHUN - 1] = tahun;
    // Kolom 8 & 9 (legacy) sengaja dibiarkan kosong — konsisten dengan seluruh data lama.
    rowArray[MASTER_COL.PIHAK_SATU_NAMA - 1] = pihakSatu.nama;
    rowArray[MASTER_COL.PIHAK_SATU_NIP - 1] = pihakSatu.nip;
    rowArray[MASTER_COL.PIHAK_SATU_JABATAN - 1] = pihakSatu.jabatan;
    rowArray[MASTER_COL.PIHAK_SATU_ALAMAT - 1] = pihakSatu.alamat;
    rowArray[MASTER_COL.PIHAK_KEDUA_NAMA - 1] = pihakKedua.nama;
    rowArray[MASTER_COL.PIHAK_KEDUA_NIP - 1] = pihakKedua.nip;
    rowArray[MASTER_COL.PIHAK_KEDUA_JABATAN - 1] = pihakKedua.jabatan;
    rowArray[MASTER_COL.PIHAK_KEDUA_ALAMAT - 1] = pihakKedua.alamat;
    rowArray[MASTER_COL.BANYAK_NA_BUKU - 1] = banyakNaBuku;
    rowArray[MASTER_COL.BANYAK_N - 1] = banyakN;
    rowArray[MASTER_COL.BANYAK_NB - 1] = banyakNb;
    // SERI 1 & 2 dibiarkan kosong — konsisten dengan seluruh data lama.
    rowArray[MASTER_COL.NO_SERI - 1] = noSeri;
    rowArray[MASTER_COL.NOMOR_PORPORASI_1 - 1] = formatPorporasiRange_(porporasiAwal, porporasiAkhir);
    // NOMOR PORPORASI 2 dibiarkan kosong — konsisten dengan seluruh data lama.
    rowArray[MASTER_COL.MENGETAHUI_KASI - 1] = kasiNama;
    rowArray[MASTER_COL.KASI_NIP - 1] = kasiNip;
    // Kolom LINK_ARSIP (28) dibiarkan kosong ('' dari .fill di atas) — diisi
    // belakangan lewat uploadArsip() saat dokumen tertandatangan diunggah.
    rowArray[MASTER_COL.STATUS_SIMKAH - 1] = statusSimkah;

    masterSheet.getRange(masterSheet.getLastRow() + 1, 1, 1, width).setValues([rowArray]);

    // LAST_NUMBER hanya dimajukan (tidak pernah dimundurkan) — mengisi nomor
    // yang terlewat di tahun yang sama tidak boleh membuat nomor berikutnya mundur.
    const settingSheet = getSheet_(SHEET_SETTING);
    const afterSave = getSetting();
    const currentLastYear = afterSave.LAST_NUMBER_YEAR || '';
    const currentLastNumber = parseInt(afterSave.LAST_NUMBER, 10) || 0;
    if (tahun !== currentLastYear || nomorUrut > currentLastNumber) {
      writeSettingValue_(settingSheet, 'LAST_NUMBER', String(nomorUrut));
      writeSettingValue_(settingSheet, 'LAST_NUMBER_YEAR', tahun);
    }

    return { nomorUrut: nomorUrut, noSurat: pad3_(nomorUrut), tahun: tahun, statusSimkah: statusSimkah };
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// RIWAYAT  (Tahap 3)
// ============================================================================

/**
 * Mengembalikan seluruh Berita Acara di Master. Pencarian/filter/urutan/
 * pagination dilakukan di sisi klien (script.js) karena jumlah barisnya
 * kecil (penomoran reset tiap tahun) — jadi tidak perlu query bertingkat
 * di sisi server.
 */
function getBeritaAcara() {
  const sheet = getSheet_(SHEET_MASTER);
  const data = sheet.getDataRange().getValues();
  const result = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const nomorUrut = row[MASTER_COL.NMR_SRT - 1];
    if (nomorUrut === '' || nomorUrut === null) continue; // lewati baris benar-benar kosong
    result.push({
      nomorUrut: nomorUrut,
      noSurat: row[MASTER_COL.NO_SURAT - 1],
      blnSrt: row[MASTER_COL.BLN_SRT - 1],
      hari: row[MASTER_COL.HARI - 1],
      tgl: row[MASTER_COL.TGL - 1],
      bln: row[MASTER_COL.BLN - 1],
      tahun: String(row[MASTER_COL.TAHUN - 1] || '').trim(),
      pihakSatuNama: row[MASTER_COL.PIHAK_SATU_NAMA - 1],
      pihakSatuNip: row[MASTER_COL.PIHAK_SATU_NIP - 1],
      pihakSatuJabatan: row[MASTER_COL.PIHAK_SATU_JABATAN - 1],
      pihakSatuAlamat: row[MASTER_COL.PIHAK_SATU_ALAMAT - 1],
      pihakKeduaNama: row[MASTER_COL.PIHAK_KEDUA_NAMA - 1],
      pihakKeduaNip: row[MASTER_COL.PIHAK_KEDUA_NIP - 1],
      pihakKeduaJabatan: row[MASTER_COL.PIHAK_KEDUA_JABATAN - 1],
      pihakKeduaAlamat: row[MASTER_COL.PIHAK_KEDUA_ALAMAT - 1],
      banyakNaBuku: row[MASTER_COL.BANYAK_NA_BUKU - 1],
      banyakN: row[MASTER_COL.BANYAK_N - 1],
      banyakNb: row[MASTER_COL.BANYAK_NB - 1],
      noSeri: row[MASTER_COL.NO_SERI - 1],
      porporasi: row[MASTER_COL.NOMOR_PORPORASI_1 - 1],
      kasiNama: row[MASTER_COL.MENGETAHUI_KASI - 1],
      kasiNip: row[MASTER_COL.KASI_NIP - 1],
      linkArsip: row[MASTER_COL.LINK_ARSIP - 1] || '',
      // Baris lama (dari sebelum kolom ini ada) selnya kosong -> default
      // 'Belum', konsisten dengan default saat BA baru dibuat di saveBeritaAcara().
      statusSimkah: (String(row[MASTER_COL.STATUS_SIMKAH - 1] || '').trim() === 'Sudah') ? 'Sudah' : 'Belum'
    });
  }
  return result;
}

/**
 * Hapus permanen (bukan soft delete, sesuai spesifikasi). Tidak menyentuh
 * file arsip di Drive (kalau ada) — sengaja dibiarkan supaya scan dokumen
 * yang sudah ditandatangani tidak ikut hilang tanpa sengaja.
 */
function deleteBeritaAcara(payload) {
  const nomorUrut = payload.nomorUrut;
  const tahun = payload.tahun;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rowNum = findMasterRow_(nomorUrut, tahun);
    if (rowNum === -1) throw new Error('Berita Acara Nomor ' + nomorUrut + '/' + tahun + ' tidak ditemukan (mungkin sudah dihapus?). Muat ulang halaman.');
    getSheet_(SHEET_MASTER).deleteRow(rowNum);
  } finally {
    lock.releaseLock();
  }
  return { deleted: true };
}

// ============================================================================
// ARSIP GOOGLE DRIVE  (Tahap 3)
// ============================================================================
// ARSIP GOOGLE DRIVE  (Tahap 3)
// ----------------------------------------------------------------------------
// Dipanggil lewat REST API Drive v3 langsung via UrlFetchApp (bukan lewat
// layanan DriveApp bawaan Apps Script) — sesuai arahan langsung, dan supaya
// error dari Google (kode HTTP + pesan asli) terlihat jelas, alih-alih
// dibungkus pesan generik DriveApp yang kadang kurang informatif.
//
// Otorisasi TETAP lewat OAuth token akun yang men-deploy Web App ini
// (ScriptApp.getOAuthToken()) — scope-nya sama seperti sebelumnya
// (https://www.googleapis.com/auth/drive, sudah dideklarasikan di
// appsscript.json), jadi authorizeDriveAccess() di bawah tetap wajib
// dijalankan sekali kalau Web App sudah pernah di-deploy sebelum fitur
// Drive ini ada — mengganti DriveApp dengan panggilan REST langsung TIDAK
// menghilangkan kebutuhan otorisasi itu, keduanya memakai izin yang sama.
//
// Setelah BA dicetak & ditandatangani semua pihak, hasil scan-nya diunggah
// dari halaman Riwayat dan disimpan ke folder Drive milik akun tsb.
// Penempatan folder diatur lewat konstanta ARSIP_FOLDER_ID di bagian
// KONFIGURASI paling atas file ini. Sharing folder TIDAK diubah otomatis
// oleh kode ini — kalau staf lain perlu mengakses, folder tsb perlu
// di-share manual sekali dari Google Drive.
// ============================================================================

// Menerima ID folder Drive mentah ATAU link lengkap dari address bar
// browser (https://drive.google.com/drive/folders/xxxxxxxx) dan
// mengembalikan ID-nya saja.
function extractDriveFolderId_(input) {
  const str = String(input || '').trim();
  if (!str) return '';
  const match = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : str;
}

/**
 * Pembungkus tipis di atas UrlFetchApp untuk semua panggilan Drive API v3.
 * muteHttpExceptions dipakai supaya kita bisa membaca kode status & pesan
 * error ASLI dari Google (bukan exception generik), lalu membedakan
 * sendiri: 401/403 hampir selalu soal OTORISASI belum lengkap, kode lain
 * (404, dst.) soal request itu sendiri (mis. folder/file tidak ditemukan).
 */
function driveApiRequest_(url, options) {
  const token = ScriptApp.getOAuthToken();
  const opts = Object.assign({ muteHttpExceptions: true }, options || {});
  opts.headers = Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {});

  const res = UrlFetchApp.fetch(url, opts);
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) {
    const text = res.getContentText();
    return text ? JSON.parse(text) : {};
  }

  let detail = res.getContentText();
  try { detail = JSON.parse(detail).error.message; } catch (e) { /* pakai teks mentah apa adanya */ }

  if (code === 401 || code === 403) {
    throw new Error(
      'Google Drive menolak akses (HTTP ' + code + '): ' + detail + '. Kemungkinan besar otorisasi ' +
      'belum lengkap — jalankan authorizeDriveAccess() satu kali dari editor Apps Script (lihat ' +
      'README, bagian "Mengatasi error izin Google Drive"), lalu coba lagi.'
    );
  }
  throw new Error('Google Drive API error (HTTP ' + code + '): ' + detail);
}

function driveApiFindFolderByName_(name) {
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const q = encodeURIComponent("name = '" + safeName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const result = driveApiRequest_('https://www.googleapis.com/drive/v3/files?q=' + q + '&fields=files(id,name)&pageSize=1', { method: 'get' });
  return (result.files && result.files.length) ? result.files[0].id : null;
}

function driveApiCreateFolder_(name, parentId) {
  const metadata = { name: name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) metadata.parents = [parentId];
  const result = driveApiRequest_('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(metadata)
  });
  return result.id;
}

// Sama seperti driveApiFindFolderByName_, tapi dibatasi ke ANAK LANGSUNG
// dari satu folder induk tertentu — dipakai untuk struktur Tahun/Bulan,
// supaya "2026" di dalam folder arsip tidak ketuker dengan folder lain
// yang kebetulan bernama sama di tempat lain pada Drive akun yang sama.
function driveApiFindChildFolder_(parentId, name) {
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const q = encodeURIComponent(
    "name = '" + safeName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '" + parentId + "' in parents"
  );
  const result = driveApiRequest_('https://www.googleapis.com/drive/v3/files?q=' + q + '&fields=files(id,name)&pageSize=1', { method: 'get' });
  return (result.files && result.files.length) ? result.files[0].id : null;
}

function driveApiFindOrCreateChildFolder_(parentId, name) {
  return driveApiFindChildFolder_(parentId, name) || driveApiCreateFolder_(name, parentId);
}

function getArchiveBaseFolderId_() {
  const configuredId = extractDriveFolderId_(ARSIP_FOLDER_ID);
  if (configuredId) {
    // Verifikasi folder itu benar ada & bisa diakses SEBELUM dipakai —
    // supaya errornya jelas "folder tidak ditemukan/tidak bisa diakses",
    // bukan gagal membingungkan di tengah proses unggah.
    driveApiRequest_('https://www.googleapis.com/drive/v3/files/' + configuredId + '?fields=id,name,trashed', { method: 'get' });
    return configuredId;
  }
  const folderName = 'Arsip Berita Acara NR';
  return driveApiFindFolderByName_(folderName) || driveApiCreateFolder_(folderName);
}

const BULAN_LABEL_ = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function pad2_(n) { return String(n).padStart(2, '0'); }

// Toleran terhadap teks BLN yang tidak baku pada data lama (mis. "Januari
// 2026" dengan tahun menyatu) — mencocokkan AWALAN teks terhadap daftar
// nama bulan resmi, sama seperti pola yang sudah dipakai di getDashboard().
function extractMonthNumber_(blnText) {
  const upper = String(blnText || '').toUpperCase();
  const idx = BULAN_NAMES_.findIndex(function (b) { return upper.indexOf(b) === 0; });
  return idx >= 0 ? idx + 1 : null;
}

/**
 * Folder arsip diorganisir Tahun > Bulan (format "09 - September" supaya
 * urut kronologis, bukan alfabetis, saat dilihat di Drive) di dalam folder
 * dasar (ARSIP_FOLDER_ID atau "Arsip Berita Acara NR" otomatis). Kalau
 * nama bulan pada baris Master tidak baku dan tidak bisa dikenali sama
 * sekali, dibuatkan folder "Lainnya" alih-alih gagal.
 */
function getArchiveSubfolderId_(tahun, blnText) {
  const baseId = getArchiveBaseFolderId_();
  const yearFolderId = driveApiFindOrCreateChildFolder_(baseId, String(tahun));
  const monthNumber = extractMonthNumber_(blnText);
  const monthLabel = monthNumber ? (pad2_(monthNumber) + ' - ' + BULAN_LABEL_[monthNumber - 1]) : 'Lainnya';
  return driveApiFindOrCreateChildFolder_(yearFolderId, monthLabel);
}

function findPegawaiByNip_(nip) {
  const target = String(nip || '').trim();
  const list = getPegawai();
  for (let i = 0; i < list.length; i++) {
    if (list[i].nip === target) return list[i];
  }
  return null;
}

function getFileExtension_(fileName) {
  const str = String(fileName || '');
  const idx = str.lastIndexOf('.');
  return idx !== -1 ? str.substring(idx) : '';
}

// Menerima ID file Drive mentah ATAU link lengkap (/file/d/{id}/... atau
// ?id={id}) dan mengembalikan ID-nya saja — dipakai saat menghapus/mengganti
// arsip yang sebelumnya tersimpan sebagai URL lengkap di LINK_ARSIP.
function extractDriveFileId_(url) {
  const str = String(url || '').trim();
  if (!str) return '';
  let match = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

function driveApiUploadFile_(folderId, fileName, mimeType, base64Data) {
  const boundary = '-------BeritaAcaraNR' + Utilities.getUuid().replace(/-/g, '');
  const metadata = { name: fileName, parents: [folderId] };

  const body =
    '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Type: ' + mimeType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data + '\r\n' +
    '--' + boundary + '--';

  return driveApiRequest_(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'post',
      contentType: 'multipart/related; boundary="' + boundary + '"',
      payload: body
    }
  );
}

/**
 * Mengambil isi file dari Drive untuk dipratinjau lewat DocumentPreviewer
 * di halaman Riwayat — dijalankan SERVER-SIDE lewat Apps Script, jadi
 * TIDAK kena pembatasan CORS yang selalu menghalangi fetch() langsung dari
 * browser ke endpoint alt=media milik Drive API (Google tidak mengirim
 * header CORS untuk endpoint itu — keterbatasan Google, bukan sesuatu
 * yang bisa diperbaiki dari sisi browser).
 */
function getArsipFileContent(params) {
  const fileId = String(params.fileId || '').trim();
  if (!fileId) throw new Error('fileId wajib diisi.');

  const meta = driveApiRequest_('https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=name,mimeType', { method: 'get' });

  const token = ScriptApp.getOAuthToken();
  const res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Gagal mengambil isi file dari Drive (HTTP ' + code + ').');
  }

  return {
    name: meta.name,
    mimeType: meta.mimeType,
    base64Data: Utilities.base64Encode(res.getContent())
  };
}

/**
 * Jalankan fungsi ini dari editor Apps Script (dropdown "Select function"
 * di toolbar > pilih authorizeDriveAccess > klik Run ▷) setiap kali
 * menambahkan kode yang butuh izin baru, ATAU kapan pun Drive/Spreadsheet
 * bermasalah dan Anda butuh kepastian apa yang sebenarnya terjadi.
 *
 * BUKAN sekadar mencoba lalu melapor gagal/berhasil — fungsi ini bertanya
 * LANGSUNG ke Google lewat endpoint tokeninfo, scope APA SAJA yang
 * benar-benar melekat pada token otorisasi saat ini, dan menuliskannya
 * satu per satu ke Execution log (ikon jam di sidebar editor). Ini bukti
 * pasti — bukan tebakan dari gejala error — jadi kalau Drive masih gagal
 * setelah ini, log-nya akan menunjukkan PERSIS scope mana yang hilang.
 *
 * Kalau scope yang dibutuhkan ternyata TIDAK ADA meskipun sudah ada di
 * appsscript.json: ini gejala umum Apps Script tidak selalu menampilkan
 * ulang layar persetujuan saat scope BARU ditambahkan ke manifest yang
 * projectnya sudah pernah diotorisasi sebelumnya — otorisasi lama
 * "dianggap cukup" padahal sudah tidak. Perbaikannya WAJIB manual:
 *   1. Buka https://myaccount.google.com/permissions
 *   2. Cari nama project Apps Script ini (biasanya sama dengan nama
 *      Spreadsheet, atau "Untitled project" kalau belum diganti namanya).
 *   3. Klik masuk, lalu "Remove Access" / "Hapus Akses".
 *   4. Kembali ke editor Apps Script, jalankan authorizeDriveAccess() lagi
 *      — kali ini Google WAJIB menampilkan layar persetujuan yang benar-
 *      benar baru, mencakup SEMUA scope di appsscript.json saat ini.
 *
 * Menjalankan fungsi APAPUN lewat tombol Run di editor (bukan lewat Web
 * App) akan memicu layar persetujuan itu. Setelah disetujui, Web App yang
 * sudah ter-deploy otomatis ikut memakai izin yang sama (keduanya jalan
 * sebagai akun yang sama) — tidak perlu membuat deployment baru.
 */
function authorizeDriveAccess() {
  const token = ScriptApp.getOAuthToken();

  Logger.log('=== DIAGNOSTIK OTORISASI — mulai ===');

  // --- Langkah 1: tanya LANGSUNG ke Google scope apa yang benar-benar
  // melekat pada token ini SAAT INI, bukan menebak dari appsscript.json. ---
  const tokenInfoRes = UrlFetchApp.fetch(
    'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + encodeURIComponent(token),
    { muteHttpExceptions: true }
  );
  const tokenInfoCode = tokenInfoRes.getResponseCode();
  const tokenInfoText = tokenInfoRes.getContentText();

  Logger.log('--- Langkah 1: Cek scope yang benar-benar melekat pada token ---');
  Logger.log('HTTP status: ' + tokenInfoCode);

  let hasDrive = false, hasExternalRequest = false, hasSpreadsheets = false;
  if (tokenInfoCode === 200) {
    const info = JSON.parse(tokenInfoText);
    const scopes = (info.scope || '').split(' ').filter(function (s) { return s; });
    Logger.log('Token berlaku untuk akun: ' + (info.email || '(tidak diketahui)'));
    Logger.log('Jumlah scope yang melekat sekarang: ' + scopes.length);
    scopes.forEach(function (s) { Logger.log('  - ' + s); });

    hasDrive = scopes.indexOf('https://www.googleapis.com/auth/drive') !== -1;
    hasExternalRequest = scopes.indexOf('https://www.googleapis.com/auth/script.external_request') !== -1;
    hasSpreadsheets = scopes.some(function (s) { return s.indexOf('spreadsheets') !== -1; });

    Logger.log('--- Kesimpulan Langkah 1 ---');
    Logger.log('Scope drive ada? ' + (hasDrive ? 'YA' : 'TIDAK ADA <-- PENYEBAB error 403 "insufficient authentication scopes" kalau ini yang hilang'));
    Logger.log('Scope script.external_request ada? ' + (hasExternalRequest ? 'YA' : 'TIDAK ADA <-- PENYEBAB error "permission to call UrlFetchApp" kalau ini yang hilang'));
    Logger.log('Scope spreadsheets ada? ' + (hasSpreadsheets ? 'YA' : 'TIDAK ADA'));
  } else {
    Logger.log('Gagal memeriksa token (respons: ' + tokenInfoText + '). Lanjut ke Langkah 2 saja.');
  }

  if (tokenInfoCode === 200 && (!hasDrive || !hasExternalRequest)) {
    Logger.log('=== DIAGNOSTIK SELESAI — DITEMUKAN MASALAH: scope kurang lengkap ===');
    throw new Error(
      'Token otorisasi SAAT INI tidak memiliki scope yang dibutuhkan (rincian lengkap ada di Execution ' +
      'log — ikon jam di sidebar editor). Ini biasanya berarti otorisasi LAMA (dari sebelum ' +
      'appsscript.json ditambah scope baru) masih dipakai, dan Apps Script tidak otomatis meminta ulang. ' +
      'Perbaikan WAJIB manual: buka https://myaccount.google.com/permissions, cari project Apps Script ' +
      'ini, klik "Remove Access", lalu jalankan authorizeDriveAccess() lagi dari awal — itu akan memaksa ' +
      'layar persetujuan yang benar-benar baru.'
    );
  }

  // --- Langkah 2: tes panggilan sesungguhnya, satu per satu, supaya kalau
  // ada yang gagal di sini padahal Langkah 1 bilang scope-nya lengkap,
  // kita tahu masalahnya BUKAN scope — melainkan sesuatu yang lain
  // (folder tidak ditemukan, dsb.) dan pesan errornya akan bilang persis apa. ---
  Logger.log('--- Langkah 2: Tes panggilan Drive API sesungguhnya ---');
  try {
    const info = driveApiRequest_('https://www.googleapis.com/drive/v3/about?fields=user', { method: 'get' });
    Logger.log('BERHASIL. Masuk Drive sebagai: ' + (info.user && info.user.emailAddress));
  } catch (err) {
    Logger.log('GAGAL: ' + err.message);
    Logger.log('=== DIAGNOSTIK SELESAI — GAGAL di Langkah 2 ===');
    throw err;
  }

  Logger.log('--- Langkah 3: Tes akses Spreadsheet ---');
  try {
    const sheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
    Logger.log('BERHASIL. Nama Spreadsheet: "' + sheetName + '"');
  } catch (err) {
    Logger.log('GAGAL: ' + err.message);
    Logger.log('=== DIAGNOSTIK SELESAI — GAGAL di Langkah 3 ===');
    throw err;
  }

  Logger.log('=== DIAGNOSTIK SELESAI — SEMUA BERHASIL, otorisasi lengkap ===');
}

/**
 * Menerima file (dikirim sebagai base64 dari browser) dan mengunggahnya ke
 * folder arsip Drive lewat REST API (diorganisir Tahun > Bulan), dengan
 * nama file "BAST KUA {nama KUA}", lalu menyimpan link-nya ke kolom
 * LINK_ARSIP pada baris Master yang sesuai. Kalau baris itu sudah punya
 * arsip sebelumnya, file LAMA dihapus dulu dari Drive (replace, bukan
 * menumpuk) — pakai deleteArsip() secara terpisah kalau hanya ingin
 * menghapus tanpa mengganti. Ukuran file dibatasi ~15MB di sisi klien
 * (api.js) — batas payload Apps Script jauh di atas itu, ini murni jaga-
 * jaga supaya unggahan besar tidak terasa macet tanpa keterangan.
 */
function uploadArsip(payload) {
  const nomorUrut = payload.nomorUrut;
  const tahun = payload.tahun;
  const fileName = String(payload.fileName || 'arsip.pdf');
  const mimeType = String(payload.mimeType || 'application/pdf');
  const base64Data = payload.base64Data;
  if (!base64Data) throw new Error('Tidak ada file yang dikirim.');
  try {
    Utilities.base64Decode(base64Data);
  } catch (err) {
    throw new Error('File gagal diproses (data tidak valid) — coba unggah ulang.');
  }

  const rowNum = findMasterRow_(nomorUrut, tahun);
  if (rowNum === -1) throw new Error('Berita Acara Nomor ' + nomorUrut + '/' + tahun + ' tidak ditemukan. Muat ulang halaman Riwayat.');

  const masterSheet = getSheet_(SHEET_MASTER);
  const rowData = masterSheet.getRange(rowNum, 1, 1, MASTER_COL.KASI_NIP).getValues()[0];
  const bln = rowData[MASTER_COL.BLN - 1];
  const pihakKeduaNip = rowData[MASTER_COL.PIHAK_KEDUA_NIP - 1];
  const existingLink = masterSheet.getRange(rowNum, MASTER_COL.LINK_ARSIP).getValue();

  // Sudah ada arsip sebelumnya di baris ini -> hapus dulu (replace, bukan menumpuk).
  const existingFileId = extractDriveFileId_(existingLink);
  if (existingFileId) {
    try {
      driveApiRequest_('https://www.googleapis.com/drive/v3/files/' + existingFileId, { method: 'delete' });
    } catch (err) {
      // Lanjut saja walau gagal (mis. file lama sudah dihapus manual dari Drive) —
      // yang penting arsip baru tetap berhasil diunggah & tercatat.
    }
  }

  const pegawaiKedua = findPegawaiByNip_(pihakKeduaNip);
  const kuaLabel = (pegawaiKedua && pegawaiKedua.kua) ? pegawaiKedua.kua : 'KUA';

  const folderId = getArchiveSubfolderId_(tahun, bln);
  const safeName = 'BAST KUA ' + kuaLabel + ' - ' + pad3_(parseInt(nomorUrut, 10)) + '-' + tahun + getFileExtension_(fileName);
  const uploaded = driveApiUploadFile_(folderId, safeName, mimeType, base64Data);
  const fileUrl = uploaded.webViewLink || ('https://drive.google.com/file/d/' + uploaded.id + '/view');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    masterSheet.getRange(rowNum, MASTER_COL.LINK_ARSIP).setValue(fileUrl);
  } finally {
    lock.releaseLock();
  }

  return { fileUrl: fileUrl, fileName: safeName, fileId: uploaded.id };
}

/**
 * Menghapus arsip yang sudah tersimpan (file di Drive + link di kolom
 * LINK_ARSIP) TANPA menggantinya dengan yang baru — dipakai tombol "Hapus
 * Arsip" di modal Lihat Detail. Kalau filenya ternyata sudah tidak ada di
 * Drive (mis. dihapus manual sebelumnya), tetap lanjut membersihkan
 * LINK_ARSIP di Master supaya tidak ada link mati yang nyangkut.
 */
function deleteArsip(payload) {
  const nomorUrut = payload.nomorUrut;
  const tahun = payload.tahun;
  const rowNum = findMasterRow_(nomorUrut, tahun);
  if (rowNum === -1) throw new Error('Berita Acara Nomor ' + nomorUrut + '/' + tahun + ' tidak ditemukan. Muat ulang halaman Riwayat.');

  const sheet = getSheet_(SHEET_MASTER);
  const currentLink = sheet.getRange(rowNum, MASTER_COL.LINK_ARSIP).getValue();
  const fileId = extractDriveFileId_(currentLink);

  if (!fileId) throw new Error('Baris ini belum punya arsip untuk dihapus.');

  try {
    driveApiRequest_('https://www.googleapis.com/drive/v3/files/' + fileId, { method: 'delete' });
  } catch (err) {
    // Lanjut membersihkan LINK_ARSIP walau penghapusan di Drive gagal
    // (mis. filenya memang sudah tidak ada) — tidak ada gunanya menyimpan
    // link yang sudah mati.
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    sheet.getRange(rowNum, MASTER_COL.LINK_ARSIP).setValue('');
  } finally {
    lock.releaseLock();
  }

  return { deleted: true };
}

/**
 * Menandai status pemindahan stok buku ke SIMKAH untuk satu Berita Acara
 * yang SUDAH tersimpan. Dipanggil dari toggle di halaman Riwayat (bukan
 * hanya saat Buat BA) karena pemindahan ke SIMKAH lazimnya memang baru
 * dilakukan belakangan oleh operator, terpisah dari waktu BA fisiknya
 * dibuat — sehingga status ini perlu bisa diubah kapan saja setelahnya,
 * bukan hanya ditentukan sekali di awal.
 */
function updateStatusSimkah(payload) {
  const nomorUrut = payload.nomorUrut;
  const tahun = payload.tahun;
  const status = (String(payload.status || '').trim() === 'Sudah') ? 'Sudah' : 'Belum';
  const rowNum = findMasterRow_(nomorUrut, tahun);
  if (rowNum === -1) throw new Error('Berita Acara Nomor ' + nomorUrut + '/' + tahun + ' tidak ditemukan. Muat ulang halaman Riwayat.');

  const sheet = getSheet_(SHEET_MASTER);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    sheet.getRange(rowNum, MASTER_COL.STATUS_SIMKAH).setValue(status);
  } finally {
    lock.releaseLock();
  }

  return { nomorUrut: nomorUrut, tahun: tahun, statusSimkah: status };
}