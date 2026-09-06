/**
 * api.js
 * ============================================================================
 * Lapisan komunikasi antara UI (script.js) dan backend Google Apps Script
 * (appscript/Code.gs). Semua request lewat fetch(), tidak ada URL yang
 * di-hardcode di luar config.js.
 *
 * Semua fungsi di sini melempar Error (throw) jika gagal — pemanggilnya
 * (script.js) bertanggung jawab menangkap dan menampilkannya sebagai toast.
 * Jika sukses, fungsi mengembalikan langsung isi field "data" dari respons
 * server (bukan seluruh amplop {success, message, data}).
 * ============================================================================
 */

const Api = (() => {

  function ensureConfigured() {
    if (!CONFIG.WEB_APP_URL) {
      throw new Error(
        'WEB_APP_URL belum diisi di config.js. Deploy dulu appscript/Code.gs ' +
        'sebagai Web App, lalu tempel URL-nya di config.js (lihat README.md).'
      );
    }
  }

  async function parseResponse(res) {
    let json;
    try {
      json = await res.json();
    } catch (err) {
      throw new Error(
        'Respons server tidak bisa dibaca sebagai JSON (status ' + res.status + '). ' +
        'Pastikan Web App sudah di-deploy dengan akses "Anyone".'
      );
    }
    if (!json || json.success !== true) {
      throw new Error((json && json.message) || 'Terjadi kesalahan yang tidak diketahui dari server.');
    }
    return json.data;
  }

  async function get(action, params) {
    ensureConfigured();
    const url = new URL(CONFIG.WEB_APP_URL);
    url.searchParams.set('action', action);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });
    }
    let res;
    try {
      res = await fetch(url.toString(), { method: 'GET' });
    } catch (err) {
      throw new Error('Tidak bisa menghubungi server (periksa koneksi internet / URL Web App).');
    }
    return parseResponse(res);
  }

  async function post(action, payload) {
    ensureConfigured();
    let res;
    try {
      // PENTING — Content-Type sengaja "text/plain", BUKAN "application/json":
      // Web App Google Apps Script tidak menjawab preflight request (metode
      // HTTP OPTIONS). Jika kita memakai Content-Type "application/json",
      // browser modern WAJIB mengirim preflight dulu sebelum POST yang
      // sesungguhnya, dan preflight itu akan gagal (CORS error) karena GAS
      // tidak meresponsnya. "text/plain" dianggap browser sebagai
      // "simple request" sehingga tidak memicu preflight sama sekali.
      // Isi body tetap string JSON biasa; Code.gs mem-parsing-nya manual
      // lewat JSON.parse(e.postData.contents).
      res = await fetch(CONFIG.WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, payload: payload || {} })
      });
    } catch (err) {
      throw new Error('Tidak bisa menghubungi server (periksa koneksi internet / URL Web App).');
    }
    return parseResponse(res);
  }

  return {
    // ---- Dashboard ----
    getDashboard: () => get('getDashboard'),

    // ---- Pegawai ----
    getPegawai: () => get('getPegawai'),
    savePegawai: (data) => post('savePegawai', data),
    updatePegawai: (data) => post('updatePegawai', data),
    deletePegawai: (nip) => post('deletePegawai', { nip: nip }),

    // ---- Setting ----
    getSetting: () => get('getSetting'),
    saveSetting: (settingsObj) => post('saveSetting', { settings: settingsObj }),

    // ---- Migrasi ----
    runMigration: () => post('migrateDatabase'),

    // ---- Buat Berita Acara ----
    generateNomor: (tahun) => get('generateNomor', { tahun: tahun }),
    checkPorporasi: (awal, akhir) => get('checkPorporasi', { awal: awal, akhir: akhir }),
    saveBeritaAcara: (data) => post('saveBeritaAcara', data),

    // ---- Riwayat ----
    getBeritaAcara: () => get('getBeritaAcara'),
    deleteBeritaAcara: (nomorUrut, tahun) => post('deleteBeritaAcara', { nomorUrut, tahun }),
    uploadArsip: (data) => post('uploadArsip', data),
    getArsipFileContent: (fileId) => get('getArsipFileContent', { fileId })
  };
})();
