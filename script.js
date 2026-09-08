/**
 * script.js
 * ============================================================================
 * Logika UI aplikasi Berita Acara Serah Terima Sarana Administrasi NR.
 *
 * Tahap ini (Tahap 1) mengaktifkan penuh: Dashboard, Pegawai (CRUD), dan
 * Pengaturan. Halaman Buat BA & Riwayat masih placeholder — logikanya akan
 * ditambahkan sebagai fungsi baru di file ini pada tahap berikutnya, tanpa
 * mengubah apa yang sudah ada di sini.
 * ============================================================================
 */

// ============================================================================
// 1. UTIL: Nama hari & bulan Indonesia (dipakai ulang di halaman Buat BA nanti)
// ============================================================================
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getIndonesianDayName(date) { return HARI_ID[date.getDay()]; }
function getIndonesianMonthName(date) { return BULAN_ID[date.getMonth()]; }
function formatIndonesianDateLong(date) {
  return `${getIndonesianDayName(date)}, ${date.getDate()} ${getIndonesianMonthName(date)} ${date.getFullYear()}`;
}

// ============================================================================
// 1B. DATA REFERENSI: Jabatan & daftar KUA Kecamatan
// ----------------------------------------------------------------------------
// Dua sisi Berita Acara punya sumber pegawai yang berbeda: Pihak Pertama
// selalu staf Seksi Bimas Islam (yang menyerahkan), Pihak Kedua selalu staf
// KUA Kecamatan (yang menerima) — pola ini konsisten di seluruh data Master
// yang ada. Daftar Jabatan & KUA ini dipakai di modal Tambah/Ubah Pegawai
// (combobox — boleh pilih dari daftar ATAU ketik manual lewat <datalist>),
// dan nanti juga dipakai untuk memfilter dropdown Pihak Pertama/Kedua pada
// formulir Buat BA (Tahap berikutnya).
// ============================================================================
const JABATAN_BIMAS = [
  'Kepala Seksi Bimas', 'Penyuluh Agama Kristen', 'Penyuluh Agama Katolik',
  'JFU', 'JFT', 'Badan Penyelenggara Jaminan Produk Halal', 'Pengelola Pengadaan Barang dan Jasa'
];
const JABATAN_KUA = [
  'Kepala KUA', 'Plt. Kepala KUA', 'Penghulu', 'Penyuluh Agama Islam', 'JFU',
  'Pengadministrasi', 'Pengelola Umum Operasional', 'Penata Layanan Operasional',
  'Operator Layanan Operasional', 'Operator KUA', 'Tenaga Administrasi', 'Staf KUA', 'Honorer'
];
// Alamat lengkap (Kelurahan/Kecamatan/Kabupaten sudah diverifikasi terhadap
// situs resmi kemenagindramayu.com) — dipakai sebagai saran default Alamat
// saat menambah pegawai Bimas Islam baru. Untuk pegawai LAMA yang Alamat-nya
// masih versi pendek, lihat resolveAlamatLengkapPihakSatu_() di bawah, yang
// memakai setting ALAMAT_BIMAS_LENGKAP (bisa diubah di halaman Pengaturan)
// sebagai fallback khusus saat mencetak, tanpa perlu mengedit data pegawai
// satu per satu.
const ALAMAT_BIMAS_DEFAULT = 'Jl. Olah Raga No. 03, Kelurahan Karanganyar, Kecamatan Indramayu, Kabupaten Indramayu';
const KUA_LIST = [
  { nama: 'Anjatan', alamat: 'Jl. Raya Cilandak No. 31, Kecamatan Anjatan, Kabupaten Indramayu' },
  { nama: 'Arahan', alamat: 'Jl. Raya Cidempet, Kecamatan Arahan, Kabupaten Indramayu' },
  { nama: 'Balongan', alamat: 'Jl. Raya Tegalurung KM. 06, Kecamatan Balongan, Kabupaten Indramayu' },
  { nama: 'Bangodua', alamat: 'Jl. Raya Curug-Tegalgirang No. 68, Kecamatan Bangodua, Kabupaten Indramayu' },
  { nama: 'Bongas', alamat: 'Jl. Kertajaya No. 01, Kecamatan Bongas, Kabupaten Indramayu' },
  { nama: 'Cantigi', alamat: 'Jl. Raya Cantigi Kulon, Desa Cantigi Kulon, Kecamatan Cantigi, Kabupaten Indramayu' },
  { nama: 'Cikedung', alamat: 'Jl. Raya Cikedung, Kecamatan Cikedung, Kabupaten Indramayu' },
  { nama: 'Gabuswetan', alamat: 'Jl. PU Saradan No. 371, Kecamatan Gabuswetan, Kabupaten Indramayu' },
  { nama: 'Gantar', alamat: 'Jl. Raya Gantar KM. 07, Kecamatan Gantar, Kabupaten Indramayu' },
  { nama: 'Haurgeulis', alamat: 'Jl. Jendral Sudirman No. 35, Kecamatan Haurgeulis, Kabupaten Indramayu' },
  { nama: 'Indramayu', alamat: 'Jl. Wiralodra No. 09, Kelurahan Lemah Mekar, Kecamatan Indramayu, Kabupaten Indramayu' },
  { nama: 'Jatibarang', alamat: 'Jl. Raya Jatisawit Blok Karang Malang, Kecamatan Jatibarang, Kabupaten Indramayu' },
  { nama: 'Juntinyuat', alamat: 'Jl. Raya Juntinyuat No. 6, Kecamatan Juntinyuat, Kabupaten Indramayu' },
  { nama: 'Kandanghaur', alamat: 'Jl. Raya Ilir Kandanghaur No. 14, Kecamatan Kandanghaur, Kabupaten Indramayu' },
  { nama: 'Karangampel', alamat: 'Jl. Raya Dampuawang No. 131, Kecamatan Karangampel, Kabupaten Indramayu' },
  { nama: 'Kedokan Bunder', alamat: 'Jl. Raya Cangkingan KM. 3,5, Kecamatan Kedokan Bunder, Kabupaten Indramayu' },
  { nama: 'Kertasemaya', alamat: 'Jl. Raya Bondan No. 09, Kecamatan Kertasemaya, Kabupaten Indramayu' },
  { nama: 'Krangkeng', alamat: 'Jl. Raya Krangkeng No. 06, Kecamatan Krangkeng, Kabupaten Indramayu' },
  { nama: 'Kroya', alamat: 'Jl. Raya Pejaten, Kecamatan Kroya, Kabupaten Indramayu' },
  { nama: 'Lelea', alamat: 'Jl. Raya Lelea-Tugu No. 13, Kecamatan Lelea, Kabupaten Indramayu' },
  { nama: 'Lohbener', alamat: 'Jl. Raya Lohbener No. 10, Kecamatan Lohbener, Kabupaten Indramayu' },
  { nama: 'Losarang', alamat: 'Jl. Turangga Bahari No. 2, Desa Jangga, Kecamatan Losarang, Kabupaten Indramayu' },
  { nama: 'Pasekan', alamat: 'Jl. Pattimura No. 2003, Karanganyar, Kecamatan Pasekan, Kabupaten Indramayu' },
  { nama: 'Patrol', alamat: 'Jl. Raya Patrol KM. 46, Kecamatan Patrol, Kabupaten Indramayu' },
  { nama: 'Sindang', alamat: 'Jl. Singalodra No. 4, Kecamatan Sindang, Kabupaten Indramayu' },
  { nama: 'Sliyeg', alamat: 'Jl. Siliwangi No. 133, Kecamatan Sliyeg, Kabupaten Indramayu' },
  { nama: 'Sukagumiwang', alamat: 'Jl. Raya Sukagumiwang, Kecamatan Sukagumiwang, Kabupaten Indramayu' },
  { nama: 'Sukra', alamat: 'Jl. Raya Pantura, Bogeg 005/001, Karanglayung, Kecamatan Sukra, Kabupaten Indramayu' },
  { nama: 'Terisi', alamat: 'Jl. Raya Rajasinga No. 030, Kecamatan Terisi, Kabupaten Indramayu' },
  { nama: 'Tukdana', alamat: 'Jl. Raya Karangkerta No. 06, RT 03/RW 02, Desa Karangkerta, Kecamatan Tukdana, Kabupaten Indramayu' },
  { nama: 'Widasari', alamat: 'Jl. Komplek Masjid Jami\' Miftahul Jannah, Desa Kongsijaya No. 1, Kecamatan Widasari, Kabupaten Indramayu' }
];

// Mengisi satu <select> dengan 31 opsi KUA Kecamatan. Dipakai untuk beberapa
// dropdown berbeda yang semuanya butuh daftar KUA yang sama persis: combobox
// KUA di modal Pegawai, filter KUA di Buat BA (Pihak Kedua — lihat perbaikan
// UX #1), dan filter KUA di Riwayat (perbaikan #5). Elemen pemanggil sudah
// menaruh <option value="">— placeholder —</option> sendiri di HTML, jadi
// fungsi ini hanya menambahkan 31 opsi KUA-nya saja.
function populateKuaOptionsInto(select) {
  if (!select) return;
  KUA_LIST.forEach((k) => {
    const opt = document.createElement('option');
    opt.value = k.nama;
    opt.textContent = k.nama;
    select.appendChild(opt);
  });
}

function populateKuaSelect() {
  populateKuaOptionsInto(document.getElementById('pegawai-kua'));
  populateKuaOptionsInto(document.getElementById('ba-pihak-kedua-kua'));
  populateKuaOptionsInto(document.getElementById('riwayat-filter-kua'));
}

function populateJabatanDatalist(kategori) {
  const datalist = document.getElementById('jabatan-options');
  const options = kategori === 'KUA' ? JABATAN_KUA : kategori === 'Bimas Islam' ? JABATAN_BIMAS : [];
  datalist.innerHTML = options.map((j) => `<option value="${escapeHtml(j)}"></option>`).join('');
}

function setPegawaiKategori(kategori) {
  document.getElementById('pegawai-kategori').value = kategori;
  document.querySelectorAll('#pegawai-kategori-segmented .segmented__option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.kategori === kategori);
  });
  document.getElementById('pegawai-kategori-segmented').closest('.field').classList.remove('has-error');
  populateJabatanDatalist(kategori);

  const kuaField = document.getElementById('field-pegawai-kua');
  if (kategori === 'KUA') {
    kuaField.style.display = '';
  } else if (kategori === 'Bimas Islam') {
    kuaField.style.display = 'none';
    document.getElementById('pegawai-kua').value = '';
    if (!document.getElementById('pegawai-alamat').value.trim()) {
      document.getElementById('pegawai-alamat').value = ALAMAT_BIMAS_DEFAULT;
    }
  }
}

document.querySelectorAll('#pegawai-kategori-segmented .segmented__option').forEach((btn) => {
  btn.addEventListener('click', () => setPegawaiKategori(btn.dataset.kategori));
});

document.getElementById('pegawai-kua').addEventListener('change', (e) => {
  const kua = KUA_LIST.find((k) => k.nama === e.target.value);
  if (kua) document.getElementById('pegawai-alamat').value = kua.alamat;
});

// ============================================================================
// 2. UTIL: Toast notifikasi
// ============================================================================
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/></svg>';
const ICON_ALERT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';

function toast(message, type) {
  type = type || 'success';
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' toast--error' : type === 'warning' ? ' toast--warning' : '');
  el.innerHTML =
    (type === 'success' ? ICON_CHECK : ICON_ALERT) +
    '<span>' + escapeHtml(message) + '</span>' +
    '<button class="toast__close" type="button" aria-label="Tutup">&times;</button>';
  el.querySelector('.toast__close').addEventListener('click', () => el.remove());
  stack.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str === undefined || str === null ? '' : str);
  return div.innerHTML;
}

// ============================================================================
// 3. UTIL: Modal generik
// ============================================================================
function openModal(id) { document.getElementById(id).classList.add('is-open'); }
function closeModal(id) { document.getElementById(id).classList.remove('is-open'); }

document.querySelectorAll('[data-close-modal]').forEach((btn) => {
  btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
});
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });
});

let _confirmCallback = null;
function confirmAction(message, onConfirm, title) {
  document.getElementById('modal-confirm-title').textContent = title || 'Konfirmasi';
  document.getElementById('modal-confirm-message').textContent = message;
  _confirmCallback = onConfirm;
  openModal('modal-confirm');
}
document.getElementById('btn-confirm-yes').addEventListener('click', () => {
  const cb = _confirmCallback;
  closeModal('modal-confirm');
  _confirmCallback = null;
  if (typeof cb === 'function') cb();
});

// ============================================================================
// 4. UTIL: Status loading pada tombol
// ============================================================================
function setButtonLoading(btn, isLoading, loadingText) {
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span><span>' + escapeHtml(loadingText || 'Memproses...') + '</span>';
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

// ============================================================================
// 5. NAVIGASI ANTAR HALAMAN
// ============================================================================
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  'buat-ba': 'Buat Berita Acara',
  riwayat: 'Riwayat',
  pegawai: 'Pegawai',
  pengaturan: 'Pengaturan'
};

function goToPage(pageKey) {
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.page === pageKey);
  });
  document.querySelectorAll('.page').forEach((section) => {
    section.classList.toggle('is-active', section.dataset.page === pageKey);
  });
  document.getElementById('page-title').textContent = PAGE_TITLES[pageKey] || '';

  if (pageKey === 'dashboard') loadDashboard();
  if (pageKey === 'pegawai' && !_pegawaiLoadedOnce) loadPegawai();
  if (pageKey === 'pengaturan') loadSettings();
  if (pageKey === 'buat-ba') loadBuatBaPage();
  if (pageKey === 'riwayat' && !_riwayatLoadedOnce) loadRiwayat();
}

document.querySelectorAll('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => goToPage(btn.dataset.page));
});

// ============================================================================
// 6. DASHBOARD
// ============================================================================
async function loadDashboard() {
  const statusEl = document.getElementById('dashboard-status');
  statusEl.textContent = 'Memuat status...';
  try {
    const data = await Api.getDashboard();
    document.getElementById('stat-total-ba').textContent = data.totalBA;
    document.getElementById('stat-total-pegawai').textContent = data.totalPegawai;
    document.getElementById('stat-ba-bulan-ini').textContent = data.baBulanIni;
    document.getElementById('stat-nomor-terakhir').textContent = data.nomorTerakhir || '–';
    document.querySelectorAll('.stat-tile__value').forEach((el) => el.classList.remove('is-loading'));
    statusEl.textContent = 'Tersambung ke Spreadsheet · diperbarui ' + new Date().toLocaleTimeString('id-ID');
  } catch (err) {
    statusEl.textContent = 'Gagal memuat: ' + err.message;
    toast(err.message, 'error');
  }
}

// ============================================================================
// 6B. UTIL: Tabel yang bisa diurutkan dengan klik header (Pegawai & Riwayat)
// ============================================================================
function compareForSort(a, b) {
  const na = parseFloat(a), nb = parseFloat(b);
  const bothNumeric = !isNaN(na) && !isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '';
  if (bothNumeric) return na - nb;
  const sa = String(a === undefined || a === null ? '' : a);
  const sb = String(b === undefined || b === null ? '' : b);
  return sa.localeCompare(sb, 'id');
}

function setupSortableHeaders(theadId, onSortChange) {
  document.getElementById(theadId).querySelectorAll('th[data-sort-key]').forEach((th) => {
    th.classList.add('is-sortable');
    const indicator = document.createElement('span');
    indicator.className = 'sort-indicator';
    th.appendChild(indicator);
    th.addEventListener('click', () => onSortChange(th.dataset.sortKey));
  });
}

function updateSortIndicators(theadId, activeKey, dir) {
  document.getElementById(theadId).querySelectorAll('th[data-sort-key]').forEach((th) => {
    const indicator = th.querySelector('.sort-indicator');
    if (!indicator) return;
    indicator.textContent = th.dataset.sortKey === activeKey ? (dir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  });
}

// ============================================================================
// 7. PEGAWAI (CRUD)
// ============================================================================
let _pegawaiCache = [];
let _pegawaiLoadedOnce = false;

async function loadPegawai() {
  const tbody = document.getElementById('pegawai-tbody');
  tbody.innerHTML = '<tr><td colspan="6"><div class="loading-row"><span class="spinner"></span> Memuat data pegawai...</div></td></tr>';
  try {
    const data = await Api.getPegawai();
    _pegawaiCache = data || [];
    _pegawaiLoadedOnce = true;
    renderPegawaiTable(_pegawaiCache);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="table-empty">Gagal memuat data: ' + escapeHtml(err.message) + '</div></td></tr>';
    toast(err.message, 'error');
  }
}

function formatUnitKerja(p) {
  if (p.kategori === 'KUA') return 'KUA ' + (p.kua || '(kecamatan belum diisi)');
  if (p.kategori === 'Bimas Islam') return 'Bimas Islam';
  return p.kategori || '–';
}

let _pegawaiSortKey = null;
let _pegawaiSortDir = 'asc';
let _pegawaiLastList = [];

function sortPegawaiBy(key) {
  if (_pegawaiSortKey === key) {
    _pegawaiSortDir = _pegawaiSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    _pegawaiSortKey = key;
    _pegawaiSortDir = 'asc';
  }
  updateSortIndicators('pegawai-thead', _pegawaiSortKey, _pegawaiSortDir);
  renderPegawaiTable(_pegawaiLastList);
}
setupSortableHeaders('pegawai-thead', sortPegawaiBy);

function renderPegawaiTable(list) {
  _pegawaiLastList = list;
  const displayList = list.slice();
  if (_pegawaiSortKey) {
    displayList.sort((a, b) => {
      const cmp = compareForSort(a[_pegawaiSortKey], b[_pegawaiSortKey]);
      return _pegawaiSortDir === 'asc' ? cmp : -cmp;
    });
  }
  const tbody = document.getElementById('pegawai-tbody');
  if (!displayList.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="table-empty">Belum ada data pegawai.</div></td></tr>';
    return;
  }
  tbody.innerHTML = displayList.map((p) => `
    <tr>
      <td class="mono">${escapeHtml(p.nip)}</td>
      <td>${escapeHtml(p.nama)}</td>
      <td><span class="badge">${escapeHtml(formatUnitKerja(p))}</span></td>
      <td>${escapeHtml(p.jabatan)}</td>
      <td>${escapeHtml(p.alamat)}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" type="button" data-edit-nip="${escapeHtml(p.nip)}" aria-label="Ubah">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" type="button" data-delete-nip="${escapeHtml(p.nip)}" aria-label="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit-nip]').forEach((btn) => {
    btn.addEventListener('click', () => openEditPegawaiModal(btn.getAttribute('data-edit-nip')));
  });
  tbody.querySelectorAll('[data-delete-nip]').forEach((btn) => {
    btn.addEventListener('click', () => handleDeletePegawai(btn.getAttribute('data-delete-nip')));
  });
}

document.getElementById('pegawai-search').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return renderPegawaiTable(_pegawaiCache);
  const filtered = _pegawaiCache.filter((p) =>
    (p.nama || '').toLowerCase().includes(q) ||
    (p.nip || '').toLowerCase().includes(q) ||
    (p.jabatan || '').toLowerCase().includes(q) ||
    (p.kua || '').toLowerCase().includes(q) ||
    (p.kategori || '').toLowerCase().includes(q)
  );
  renderPegawaiTable(filtered);
});

// Konteks "tambah cepat" — diisi kalau modal Pegawai dibuka dari dalam form
// Buat BA (lihat perbaikan UX #2), supaya sesudah simpan sukses kita tahu
// pegawai baru itu harus otomatis terpilih di dropdown Pihak mana, dan
// (untuk Pihak Kedua) KUA apa yang sedang difilter saat itu. null kalau
// modal dibuka dengan cara biasa dari halaman Pegawai — perilaku lama sama
// sekali tidak berubah untuk jalur itu.
let _pegawaiModalContext = null;

function openAddPegawaiModal(context) {
  _pegawaiModalContext = context || null;
  document.getElementById('modal-pegawai-title').textContent = context ? 'Tambah Pegawai Baru' : 'Tambah Pegawai';
  document.getElementById('form-pegawai').reset();
  document.getElementById('pegawai-original-nip').value = '';
  document.getElementById('pegawai-nip').disabled = false;
  clearFieldError('pegawai-nip');
  document.querySelectorAll('#pegawai-kategori-segmented .segmented__option').forEach((btn) => {
    btn.classList.remove('is-active');
    btn.disabled = false; // reset kunci dari kemungkinan pemakaian context sebelumnya
  });
  document.getElementById('pegawai-kategori').value = '';
  document.getElementById('field-pegawai-kua').style.display = 'none';
  populateJabatanDatalist('');
  document.getElementById('pegawai-kategori-segmented').closest('.field').classList.remove('has-error');

  if (context && context.presetKategori) {
    setPegawaiKategori(context.presetKategori);
    // Kunci pilihan Kategori ke sisi yang sedang diisi di form Buat BA, supaya
    // pegawai baru ini dijamin muncul di dropdown yang benar sesudah disimpan
    // (mis. tidak sengaja tersimpan sebagai "KUA" padahal dibuka dari Pihak
    // Pertama). Tetap bisa dibatalkan dengan menutup modal ini.
    document.querySelectorAll('#pegawai-kategori-segmented .segmented__option').forEach((btn) => {
      btn.disabled = btn.dataset.kategori !== context.presetKategori;
    });
    if (context.presetKua) {
      document.getElementById('pegawai-kua').value = context.presetKua;
      const kua = KUA_LIST.find((k) => k.nama === context.presetKua);
      if (kua) document.getElementById('pegawai-alamat').value = kua.alamat;
    }
  }

  openModal('modal-pegawai');
  document.getElementById('pegawai-nip').focus();
}

function openEditPegawaiModal(nip) {
  const p = _pegawaiCache.find((x) => x.nip === nip);
  if (!p) return;
  _pegawaiModalContext = null; // Edit selalu jalur biasa, tidak pernah dari "tambah cepat" Buat BA
  document.getElementById('modal-pegawai-title').textContent = 'Ubah Pegawai';
  document.getElementById('pegawai-original-nip').value = p.nip;
  document.getElementById('pegawai-nip').value = p.nip;
  document.getElementById('pegawai-nama').value = p.nama;
  // Pastikan Kategori tidak terkunci dari kemungkinan sisa pemakaian "+ Tambah
  // Pegawai Baru" sebelumnya yang dibatalkan (mis. modal ditutup tanpa
  // disimpan) — Edit harus selalu bisa memilih kedua Kategori dengan bebas.
  document.querySelectorAll('#pegawai-kategori-segmented .segmented__option').forEach((btn) => { btn.disabled = false; });
  setPegawaiKategori(p.kategori || '');
  document.getElementById('pegawai-kua').value = p.kua || '';
  document.getElementById('pegawai-jabatan').value = p.jabatan;
  document.getElementById('pegawai-alamat').value = p.alamat; // override auto-default dari setPegawaiKategori
  clearFieldError('pegawai-nip');
  openModal('modal-pegawai');
}

// Panggilan tanpa argumen secara eksplisit (bukan hanya `openAddPegawaiModal`
// sebagai referensi) — supaya addEventListener tidak menyelipkan objek Event
// klik sebagai parameter `context`, yang akan salah dikira sebagai konteks
// "tambah cepat" dari form Buat BA.
document.getElementById('btn-tambah-pegawai').addEventListener('click', () => openAddPegawaiModal());

function clearFieldError(inputId) {
  document.getElementById(inputId).closest('.field').classList.remove('has-error');
}
function setFieldError(inputId, hasError) {
  document.getElementById(inputId).closest('.field').classList.toggle('has-error', hasError);
}

function isValidNip(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  return digitsOnly.length >= 18;
}

document.getElementById('form-pegawai').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nip = document.getElementById('pegawai-nip').value.trim();
  const originalNip = document.getElementById('pegawai-original-nip').value.trim();
  const nama = document.getElementById('pegawai-nama').value.trim();
  const kategori = document.getElementById('pegawai-kategori').value.trim();
  const kua = document.getElementById('pegawai-kua').value.trim();
  const jabatan = document.getElementById('pegawai-jabatan').value.trim();
  const alamat = document.getElementById('pegawai-alamat').value.trim();

  let hasError = false;
  if (!isValidNip(nip)) { setFieldError('pegawai-nip', true); hasError = true; } else { clearFieldError('pegawai-nip'); }
  if (!kategori) {
    document.getElementById('pegawai-kategori-segmented').closest('.field').classList.add('has-error');
    hasError = true;
  } else {
    document.getElementById('pegawai-kategori-segmented').closest('.field').classList.remove('has-error');
  }
  if (kategori === 'KUA' && !kua) {
    toast('Pilih KUA Kecamatan untuk pegawai kategori KUA.', 'error');
    hasError = true;
  }
  if (hasError) return;

  const btn = document.getElementById('btn-simpan-pegawai');
  setButtonLoading(btn, true, 'Menyimpan...');
  const isNewPegawai = !originalNip;
  const quickAddContext = _pegawaiModalContext; // simpan dulu — direset di finally sebelum promise ini selesai
  try {
    const payload = { nip, nama, kategori, kua, jabatan, alamat };
    if (originalNip) {
      await Api.updatePegawai(Object.assign({ originalNip }, payload));
      toast('Data pegawai berhasil diperbarui.');
    } else {
      await Api.savePegawai(payload);
      toast('Pegawai baru berhasil ditambahkan.');
    }
    closeModal('modal-pegawai');
    await loadPegawai();
    loadDashboard(); // total pegawai di dashboard ikut berubah

    // Kalau modal ini dibuka dari tombol "+ Tambah Pegawai Baru" di form Buat
    // BA (perbaikan UX #2), langsung pilihkan pegawai yang baru saja disimpan
    // di dropdown yang sesuai — user tidak perlu pindah halaman & mengulang
    // pengisian form sama sekali.
    if (isNewPegawai && quickAddContext && quickAddContext.target) {
      applyPegawaiQuickAddSelection_(nip, quickAddContext);
    }
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
    _pegawaiModalContext = null;
  }
});

// Sesudah pegawai baru berhasil disimpan lewat tombol "+ Tambah Pegawai Baru"
// di form Buat BA: segarkan dropdown terkait & langsung pilihkan pegawai
// tsb, supaya alur "isi form -> sadar pegawainya belum ada -> tambah -> lanjut
// isi form" jadi satu alur mulus tanpa pindah halaman ataupun kehilangan
// isian lain yang sudah diisi (tanggal, porporasi, dst. tetap seperti semula
// karena form Buat BA sama sekali tidak di-reset di sini).
function applyPegawaiQuickAddSelection_(nip, context) {
  const p = _pegawaiCache.find((x) => x.nip === nip);
  if (!p) return;

  if (context.target === 'satu' && p.kategori === 'Bimas Islam') {
    populatePihakDropdown('ba-pihak-satu', 'Bimas Islam');
    document.getElementById('ba-pihak-satu').value = p.nip;
    fillPihakDisplay('ba-satu', p);
    toast('Pegawai baru langsung dipilih sebagai Pihak Pertama.');
  } else if (context.target === 'kedua' && p.kategori === 'KUA') {
    document.getElementById('ba-pihak-kedua-kua').value = p.kua || '';
    populatePihakKeduaByKua_(p.kua || '');
    document.getElementById('ba-pihak-kedua').value = p.nip;
    fillPihakDisplay('ba-dua', p);
    toast('Pegawai baru langsung dipilih sebagai Pihak Kedua.');
  }
  // Kategori yang dipilih tidak cocok dengan target (mis. dikunci tapi tetap
  // beda) -> pegawai tetap tersimpan & tersedia di halaman Pegawai, hanya
  // tidak otomatis terpilih di sini. Tidak seharusnya terjadi karena Kategori
  // dikunci di openAddPegawaiModal(), tapi dijaga supaya tidak pernah error.
}

function handleDeletePegawai(nip) {
  const p = _pegawaiCache.find((x) => x.nip === nip);
  const nama = p ? p.nama : nip;
  confirmAction(
    `Yakin ingin menghapus data pegawai "${nama}"? Tindakan ini tidak dapat dibatalkan.`,
    async () => {
      try {
        await Api.deletePegawai(nip);
        toast('Data pegawai berhasil dihapus.');
        await loadPegawai();
        loadDashboard();
      } catch (err) {
        toast(err.message, 'error');
      }
    },
    'Hapus Pegawai'
  );
}

// ============================================================================
// 8. PENGATURAN
// ============================================================================
let _settingsCache = null;

async function fetchSettings() {
  const data = await Api.getSetting();
  _settingsCache = data;
  return data;
}

async function ensureSettingsCache() {
  if (!_settingsCache) await fetchSettings();
  return _settingsCache;
}

async function loadSettings() {
  try {
    const data = await fetchSettings();
    document.getElementById('set-kasi-nama').value = data.KASI_NAMA || '';
    document.getElementById('set-kasi-nip').value = data.KASI_NIP || '';
    document.getElementById('set-nomor-awal').value = data.NOMOR_AWAL_SURAT || '';
    document.getElementById('set-kode-kantor').value = data.KODE_KANTOR || '';
    document.getElementById('set-kode-klasifikasi').value = data.KODE_KLASIFIKASI || '';
    document.getElementById('set-nomor-format').value = data.NOMOR_FORMAT_TEMPLATE || '';
    document.getElementById('set-tahun-aktif').value = data.TAHUN_AKTIF || '';
    document.getElementById('set-alamat-bimas-lengkap').value = data.ALAMAT_BIMAS_LENGKAP || '';

    document.getElementById('info-app-name').textContent = data.APP_NAME || '–';
    document.getElementById('info-db-version').textContent = data.DB_VERSION || '–';
    document.getElementById('info-created-at').textContent = data.CREATED_AT || '–';
    document.getElementById('info-last-number').textContent = data.LAST_NUMBER || '0';
  } catch (err) {
    toast(err.message, 'error');
  }
}

document.getElementById('form-pengaturan').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-simpan-pengaturan');
  setButtonLoading(btn, true, 'Menyimpan...');
  try {
    await Api.saveSetting({
      KASI_NAMA: document.getElementById('set-kasi-nama').value.trim(),
      KASI_NIP: document.getElementById('set-kasi-nip').value.trim(),
      NOMOR_AWAL_SURAT: document.getElementById('set-nomor-awal').value.trim(),
      KODE_KANTOR: document.getElementById('set-kode-kantor').value.trim(),
      KODE_KLASIFIKASI: document.getElementById('set-kode-klasifikasi').value.trim(),
      NOMOR_FORMAT_TEMPLATE: document.getElementById('set-nomor-format').value.trim(),
      TAHUN_AKTIF: document.getElementById('set-tahun-aktif').value.trim(),
      ALAMAT_BIMAS_LENGKAP: document.getElementById('set-alamat-bimas-lengkap').value.trim()
    });
    await fetchSettings(); // segarkan cache supaya halaman Buat BA & Riwayat ikut memakai nilai terbaru
    toast('Pengaturan berhasil disimpan.');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// ============================================================================
// 8B. BUAT BERITA ACARA
// ============================================================================
const ROMAN_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
let _baLastNomorTahun = '';

function pad3(n) { return String(n).padStart(3, '0'); }

function populatePihakDropdown(selectId, kategori) {
  const select = document.getElementById(selectId);
  const currentValue = select.value;
  const options = _pegawaiCache.filter((p) => p.kategori === kategori);
  select.innerHTML = '<option value="">— Pilih —</option>' +
    options.map((p) => {
      const label = (p.kategori === 'KUA' && p.kua) ? `${p.nama} — ${p.jabatan} (KUA ${p.kua})` : `${p.nama} — ${p.jabatan}`;
      return `<option value="${escapeHtml(p.nip)}">${escapeHtml(label)}</option>`;
    }).join('');
  if (options.some((p) => p.nip === currentValue)) select.value = currentValue;
}

// ---- Perbaikan UX #1: pilih KUA dulu, baru pilih pegawainya -------------
// Dulu dropdown "Pilih Pegawai" Pihak Kedua langsung berisi SEMUA pegawai
// kategori KUA lintas 31 kecamatan sekaligus (bisa puluhan/ratusan opsi,
// sulit dicari). Sekarang dipecah dua langkah: pilih KUA Kecamatan dulu
// (#ba-pihak-kedua-kua, daftar tetap 31 KUA), baru dropdown pegawai
// (#ba-pihak-kedua) difilter hanya menampilkan staf KUA yang dipilih itu.
function populatePihakKeduaByKua_(kuaNama) {
  const select = document.getElementById('ba-pihak-kedua');
  const currentValue = select.value;
  const emptyStateEl = document.getElementById('ba-pihak-kedua-kosong');

  if (!kuaNama) {
    select.innerHTML = '<option value="">— Pilih KUA dahulu —</option>';
    select.disabled = true;
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    if (currentValue) fillPihakDisplay('ba-dua', null);
    return;
  }

  const options = _pegawaiCache.filter((p) => p.kategori === 'KUA' && p.kua === kuaNama);
  select.disabled = false;

  if (!options.length) {
    select.innerHTML = '<option value="">— Belum ada pegawai untuk KUA ini —</option>';
    if (emptyStateEl) {
      emptyStateEl.style.display = 'flex';
      const nameEl = document.getElementById('ba-pihak-kedua-kosong-nama');
      if (nameEl) nameEl.textContent = kuaNama;
    }
    fillPihakDisplay('ba-dua', null);
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = 'none';
  select.innerHTML = '<option value="">— Pilih —</option>' +
    options.map((p) => `<option value="${escapeHtml(p.nip)}">${escapeHtml(p.nama + ' — ' + p.jabatan)}</option>`).join('');
  if (options.some((p) => p.nip === currentValue)) {
    select.value = currentValue;
  } else {
    fillPihakDisplay('ba-dua', null); // KUA berganti & pilihan lama tidak berlaku lagi di sini
  }
}

function fillPihakDisplay(prefix, pegawai) {
  document.getElementById(prefix + '-nama').value = pegawai ? pegawai.nama : '';
  document.getElementById(prefix + '-nip').value = pegawai ? pegawai.nip : '';
  document.getElementById(prefix + '-jabatan').value = pegawai ? pegawai.jabatan : '';
  document.getElementById(prefix + '-alamat').value = pegawai ? pegawai.alamat : '';
}

document.getElementById('ba-pihak-satu').addEventListener('change', (e) => {
  fillPihakDisplay('ba-satu', _pegawaiCache.find((x) => x.nip === e.target.value));
});
document.getElementById('ba-pihak-kedua-kua').addEventListener('change', (e) => {
  populatePihakKeduaByKua_(e.target.value);
});
document.getElementById('ba-pihak-kedua').addEventListener('change', (e) => {
  fillPihakDisplay('ba-dua', _pegawaiCache.find((x) => x.nip === e.target.value));
});

// ---- Perbaikan UX #2: tambah pegawai baru tanpa pindah halaman ----------
document.getElementById('btn-quick-add-satu').addEventListener('click', () => {
  openAddPegawaiModal({ target: 'satu', presetKategori: 'Bimas Islam' });
});
document.getElementById('btn-quick-add-kedua').addEventListener('click', () => {
  const currentKua = document.getElementById('ba-pihak-kedua-kua').value;
  openAddPegawaiModal({ target: 'kedua', presetKategori: 'KUA', presetKua: currentKua || undefined });
});
document.getElementById('btn-quick-add-kedua-kosong').addEventListener('click', () => {
  const currentKua = document.getElementById('ba-pihak-kedua-kua').value;
  openAddPegawaiModal({ target: 'kedua', presetKategori: 'KUA', presetKua: currentKua || undefined });
});


// Ekstraksi murni (tanpa sentuh DOM) supaya bisa dipakai ulang oleh pdf.js
// untuk mencetak Nomor Surat lengkap yang identik dengan pratinjau di form.
function buildNomorSuratLengkap(nomorUrut, bulanSurat, tahun, settings) {
  const s = settings || _settingsCache || {};
  const template = s.NOMOR_FORMAT_TEMPLATE ||
    'B.{NOMOR}/{KODE_KANTOR}/{BULAN_ROMAWI}/{KODE_KLASIFIKASI}/{BULAN_ANGKA}/{TAHUN}';
  const bulanNum = parseInt(bulanSurat, 10);
  return template
    .replace('{NOMOR}', pad3(parseInt(nomorUrut, 10)))
    .replace('{KODE_KANTOR}', s.KODE_KANTOR || '')
    .replace('{BULAN_ROMAWI}', ROMAN_NUMERALS[bulanNum] || '')
    .replace('{KODE_KLASIFIKASI}', s.KODE_KLASIFIKASI || '')
    .replace('{BULAN_ANGKA}', String(bulanNum).padStart(2, '0'))
    .replace('{TAHUN}', String(tahun));
}

function updateNomorSuratPreview() {
  const tanggalVal = document.getElementById('ba-tanggal').value;
  if (!tanggalVal) return;
  const tahun = tanggalVal.split('-')[0];
  const bulanSurat = parseInt(document.getElementById('ba-bulan-surat').value, 10);
  const nomorUrut = parseInt(document.getElementById('ba-nomor-urut').value, 10);
  if (isNaN(bulanSurat) || isNaN(nomorUrut)) return;
  document.getElementById('ba-nomor-surat-preview').value = buildNomorSuratLengkap(nomorUrut, bulanSurat, tahun);
}

async function refreshNomorSuggestion(tahun) {
  const targetTahun = tahun || String(new Date().getFullYear());
  try {
    const result = await Api.generateNomor(targetTahun);
    document.getElementById('ba-nomor-urut').value = result.nomorUrut;
    _baLastNomorTahun = targetTahun;
    updateNomorSuratPreview();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function updateTanggalSummaryAndPreview() {
  const tanggalVal = document.getElementById('ba-tanggal').value;
  if (!tanggalVal) return;
  const parts = tanggalVal.split('-').map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  const date = new Date(y, m - 1, d);
  document.getElementById('ba-tanggal-summary').innerHTML =
    `Pada hari ini <strong>${getIndonesianDayName(date)}</strong>, tanggal <strong>${String(d).padStart(2, '0')}</strong> ` +
    `bulan <strong>${getIndonesianMonthName(date)}</strong> tahun <strong>${y}</strong>`;

  // Bulan Surat default mengikuti bulan Tanggal, kecuali user sudah mengubahnya sendiri manual.
  const bulanSuratSelect = document.getElementById('ba-bulan-surat');
  if (!bulanSuratSelect.dataset.userChanged) bulanSuratSelect.value = String(m);

  updateNomorSuratPreview();

  const tahunUntukNomor = String(y);
  if (tahunUntukNomor !== _baLastNomorTahun) refreshNomorSuggestion(tahunUntukNomor);
}

document.getElementById('ba-tanggal').addEventListener('change', updateTanggalSummaryAndPreview);
document.getElementById('ba-bulan-surat').addEventListener('change', (e) => {
  e.target.dataset.userChanged = '1';
  updateNomorSuratPreview();
});
document.getElementById('ba-nomor-urut').addEventListener('input', updateNomorSuratPreview);

// ---- Data Sarana: hitung otomatis Banyaknya Buku NA dari rentang porporasi, dan
//      periksa tumpang-tindih porporasi secara langsung (debounced) ----
function recomputeNaBukuOtomatis() {
  if (!document.getElementById('ba-auto-hitung').checked) return;
  const awal = parseInt(document.getElementById('ba-porporasi-awal').value, 10);
  const akhir = parseInt(document.getElementById('ba-porporasi-akhir').value, 10);
  if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) {
    document.getElementById('ba-na-buku').value = akhir - awal + 1;
  }
}
document.getElementById('ba-auto-hitung').addEventListener('change', (e) => {
  document.getElementById('ba-na-buku').readOnly = e.target.checked;
  recomputeNaBukuOtomatis();
});

let _porporasiCheckTimer = null;
function schedulePorporasiCheck() {
  recomputeNaBukuOtomatis();
  clearTimeout(_porporasiCheckTimer);
  const resultEl = document.getElementById('ba-porporasi-check-result');
  const awal = parseInt(document.getElementById('ba-porporasi-awal').value, 10);
  const akhir = parseInt(document.getElementById('ba-porporasi-akhir').value, 10);
  if (isNaN(awal) || isNaN(akhir)) { resultEl.innerHTML = ''; return; }
  if (akhir < awal) {
    resultEl.innerHTML = '<div class="inline-note inline-note--error">' + ICON_ALERT + '<span>Nomor akhir tidak boleh lebih kecil dari awal.</span></div>';
    return;
  }
  _porporasiCheckTimer = setTimeout(async () => {
    try {
      const result = await Api.checkPorporasi(awal, akhir);
      if (result.overlap) {
        resultEl.innerHTML = '<div class="inline-note inline-note--error">' + ICON_ALERT +
          '<span>Nomor porporasi sudah digunakan pada BA Nomor ' + escapeHtml(result.nomorSurat) +
          ' (rentang ' + escapeHtml(result.rentang) + ').</span></div>';
      } else {
        resultEl.innerHTML = '<div class="inline-note inline-note--success">' + ICON_CHECK + '<span>Rentang tersedia, tidak tumpang tindih dengan BA lain.</span></div>';
      }
    } catch (err) {
      resultEl.innerHTML = '';
    }
  }, 500);
}
document.getElementById('ba-porporasi-awal').addEventListener('input', schedulePorporasiCheck);
document.getElementById('ba-porporasi-akhir').addEventListener('input', schedulePorporasiCheck);

function resetBuatBaForm() {
  document.getElementById('form-buat-ba').reset();
  document.getElementById('ba-bulan-surat').dataset.userChanged = '';
  fillPihakDisplay('ba-satu', null);
  fillPihakDisplay('ba-dua', null);
  populatePihakKeduaByKua_(''); // form.reset() tidak memicu event 'change', jadi dropdown pegawai KUA perlu dikosongkan manual
  document.getElementById('ba-porporasi-check-result').innerHTML = '';
  document.getElementById('ba-tanggal').value = new Date().toISOString().slice(0, 10);
  document.getElementById('ba-auto-hitung').checked = true;
  document.getElementById('ba-na-buku').readOnly = true;
  updateTanggalSummaryAndPreview();
}
document.getElementById('btn-reset-ba').addEventListener('click', resetBuatBaForm);

async function loadBuatBaPage() {
  if (!_pegawaiLoadedOnce) await loadPegawai();
  await ensureSettingsCache();

  populatePihakDropdown('ba-pihak-satu', 'Bimas Islam');
  // Dropdown KUA (#ba-pihak-kedua-kua) berisi daftar tetap 31 kecamatan yang
  // sudah diisi sekali lewat populateKuaSelect() saat halaman pertama kali
  // dimuat — di sini cukup segarkan dropdown pegawai untuk KUA yang SEDANG
  // dipilih (kalau ada), supaya pegawai baru yang ditambahkan lewat halaman
  // Pegawai (atau tombol "+ Tambah Pegawai Baru") langsung ikut muncul tanpa
  // menghilangkan KUA yang sudah dipilih sebelumnya.
  populatePihakKeduaByKua_(document.getElementById('ba-pihak-kedua-kua').value);

  document.getElementById('ba-kasi-nama-display').value = _settingsCache.KASI_NAMA || '(belum diatur)';
  document.getElementById('ba-kasi-nip-display').value = _settingsCache.KASI_NIP || '–';

  if (!document.getElementById('ba-bulan-surat').options.length) {
    document.getElementById('ba-bulan-surat').innerHTML = BULAN_ID.map((b, i) => `<option value="${i + 1}">${b}</option>`).join('');
  }
  if (!document.getElementById('ba-tanggal').value) {
    document.getElementById('ba-tanggal').value = new Date().toISOString().slice(0, 10);
  }
  updateTanggalSummaryAndPreview();
  if (!document.getElementById('ba-nomor-urut').value) {
    await refreshNomorSuggestion(document.getElementById('ba-tanggal').value.split('-')[0]);
  }
}

document.getElementById('form-buat-ba').addEventListener('submit', async (e) => {
  e.preventDefault();

  const pihakSatuNip = document.getElementById('ba-pihak-satu').value;
  const pihakKeduaNip = document.getElementById('ba-pihak-kedua').value;
  if (!pihakSatuNip) { toast('Pilih Pihak Pertama terlebih dahulu.', 'error'); return; }
  if (!pihakKeduaNip) { toast('Pilih Pihak Kedua terlebih dahulu.', 'error'); return; }

  const tanggalVal = document.getElementById('ba-tanggal').value;
  if (!tanggalVal) { toast('Tanggal pelaksanaan wajib diisi.', 'error'); return; }
  const parts = tanggalVal.split('-').map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  const date = new Date(y, m - 1, d);

  const awal = parseInt(document.getElementById('ba-porporasi-awal').value, 10);
  const akhir = parseInt(document.getElementById('ba-porporasi-akhir').value, 10);
  if (isNaN(awal) || isNaN(akhir)) { toast('Nomor porporasi awal & akhir wajib diisi.', 'error'); return; }
  if (akhir < awal) { toast('Nomor porporasi akhir tidak boleh lebih kecil dari awal.', 'error'); return; }

  const payload = {
    nomorUrut: document.getElementById('ba-nomor-urut').value,
    tahun: String(y),
    blnSrt: document.getElementById('ba-bulan-surat').value,
    hari: getIndonesianDayName(date),
    tgl: String(d).padStart(2, '0'),
    bln: getIndonesianMonthName(date),
    pihakSatuNip: pihakSatuNip,
    pihakKeduaNip: pihakKeduaNip,
    banyakNaBuku: document.getElementById('ba-na-buku').value,
    banyakN: document.getElementById('ba-n').value,
    banyakNb: document.getElementById('ba-nb').value,
    porporasiAwal: awal,
    porporasiAkhir: akhir,
    noSeri: document.getElementById('ba-no-seri').value.trim(),
    kasiNama: (_settingsCache && _settingsCache.KASI_NAMA) || '',
    kasiNip: (_settingsCache && _settingsCache.KASI_NIP) || ''
  };

  const btn = document.getElementById('btn-simpan-ba');
  setButtonLoading(btn, true, 'Menyimpan...');
  try {
    const result = await Api.saveBeritaAcara(payload);
    toast('Berita Acara Nomor ' + result.noSurat + '/' + result.tahun + ' berhasil disimpan.');
    resetBuatBaForm();
    await refreshNomorSuggestion(String(y));
    loadDashboard();
    _riwayatLoadedOnce = false; // supaya kunjungan berikutnya ke Riwayat memuat data terbaru
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// ============================================================================
// 8C. RIWAYAT
// ============================================================================

// ---- Perbaikan #3, #4, #5: resolusi "unit kerja" & "alamat lengkap" -------
// Baris Master/BA lama hanya menyimpan Nama/NIP/Jabatan/Alamat sebagai teks
// bebas per pihak (tidak ada kolom Kategori/KUA per-BA — lihat catatan skema
// Master di Code.gs), jadi untuk menampilkan "tempat kerja" (perbaikan #4)
// dan memastikan Alamat tercetak lengkap dengan Kecamatan+Kabupaten
// (perbaikan #3) di PDF & detail Riwayat, fungsi-fungsi berikut menelusuri
// balik NIP-nya ke data Pegawai SAAT INI. Kalau pegawainya sudah terlanjur
// dihapus dari Pegawai, dicoba tebak dari teks Jabatan yang tersimpan di
// baris BA itu sendiri (mencocokkan salah satu dari 31 nama KUA sebagai
// substring) — pendekatan yang sama seperti inferJabatanKua_() di Code.gs
// untuk membaca data Master lama. Dipakai bersama oleh script.js (tabel
// Riwayat, modal Detail) dan pdf.js (pdf.js dimuat SETELAH script.js di
// index.html, jadi fungsi-fungsi global di sini sudah tersedia untuknya).

function resolveKuaNamaUntukPihakKedua_(pihakKeduaNip, pihakKeduaJabatan) {
  const p = _pegawaiCache.find((x) => x.nip === pihakKeduaNip);
  if (p && p.kua) return p.kua;
  const jabatanUpper = String(pihakKeduaJabatan || '').toUpperCase();
  const found = KUA_LIST.find((k) => jabatanUpper.indexOf(k.nama.toUpperCase()) !== -1);
  return found ? found.nama : '';
}

// Dipakai untuk kolom "KUA" baru di tabel Riwayat (perbaikan #5).
function getKuaLabelForRecord_(r) {
  return resolveKuaNamaUntukPihakKedua_(r.pihakKeduaNip, r.pihakKeduaJabatan);
}

// Dipakai untuk baris "Tempat Kerja" baru di modal Detail BA (perbaikan #4).
// kategoriKonteks WAJIB diisi oleh pemanggil ('Bimas Islam' untuk Pihak
// Pertama, 'KUA' untuk Pihak Kedua) karena itu memang aturan tetap aplikasi
// ini, terlepas dari apakah NIP-nya masih ada di data Pegawai atau tidak.
function getTempatKerjaLabel_(nip, jabatanFallback, kategoriKonteks) {
  const p = _pegawaiCache.find((x) => x.nip === nip);
  if (p && p.kategori === 'KUA') return 'KUA Kecamatan ' + (p.kua || '(kecamatan tidak diketahui)');
  if (p && p.kategori === 'Bimas Islam') return 'Seksi Bimas Islam';

  if (kategoriKonteks === 'Bimas Islam') return 'Seksi Bimas Islam';
  if (kategoriKonteks === 'KUA') {
    const kuaNama = resolveKuaNamaUntukPihakKedua_(nip, jabatanFallback);
    return kuaNama ? ('KUA Kecamatan ' + kuaNama) : 'KUA Kecamatan (tidak diketahui)';
  }
  return '-';
}

// "Lengkap" di sini berarti sudah menyebut Kecamatan & Kabupaten — dua kata
// kunci yang diminta ("...pastikan lengkap dengan kecamatan dan kabupaten").
function alamatSudahLengkap_(alamat) {
  const upper = String(alamat || '').toUpperCase();
  return upper.indexOf('KECAMATAN') !== -1 && upper.indexOf('KABUPATEN') !== -1;
}

// Pihak Kedua selalu staf KUA -> alamat RESMI (dengan Kecamatan+Kabupaten)
// sudah ada di KUA_LIST (dipakai juga untuk auto-isi form Tambah Pegawai),
// jadi itu yang diutamakan — lebih bisa diandalkan daripada teks Alamat versi
// lama yang tersimpan di baris BA/Pegawai, yang untuk banyak data migrasi
// ternyata memang belum menyebut Kecamatan/Kabupaten (lihat contoh pada
// laporan: "Jl. Raya Cilandak No. 31, Indramayu" seharusnya KUA Anjatan).
function resolveAlamatLengkapPihakKedua_(record) {
  const raw = String(record.pihakKeduaAlamat || '').trim();
  const kuaNama = resolveKuaNamaUntukPihakKedua_(record.pihakKeduaNip, record.pihakKeduaJabatan);
  const kuaData = KUA_LIST.find((k) => k.nama === kuaNama);
  if (kuaData) return kuaData.alamat;
  if (raw && alamatSudahLengkap_(raw)) return raw;
  if (raw && kuaNama) return raw + ', Kecamatan ' + kuaNama + ', Kabupaten Indramayu';
  return raw || '-';
}

// Pihak Pertama selalu staf Seksi Bimas Islam (satu alamat kantor untuk
// semua) — kalau Alamat yang tersimpan di baris BA belum lengkap, dipakai
// setting ALAMAT_BIMAS_LENGKAP (bisa diubah di halaman Pengaturan) sebagai
// gantinya, bukan konstanta tertanam, supaya kalau kantornya pindah suatu
// saat, cukup diubah dari Pengaturan tanpa perlu edit kode.
function resolveAlamatLengkapPihakSatu_(record) {
  const raw = String(record.pihakSatuAlamat || '').trim();
  if (raw && alamatSudahLengkap_(raw)) return raw;
  const fallback = (_settingsCache && _settingsCache.ALAMAT_BIMAS_LENGKAP) || '';
  if (fallback) return fallback;
  return raw || ALAMAT_BIMAS_DEFAULT;
}

// ---- Pratinjau arsip lewat DocumentPreviewer (document-previewer.js) ----
// driveFetcher WAJIB dipakai (bukan mengandalkan API key + fetch langsung
// dari browser) karena endpoint alt=media milik Drive API tidak mengirim
// header CORS — lihat komentar panjang di document-previewer.js dan di
// getArsipFileContent() pada Code.gs. Pengambilan file dilakukan lewat
// Apps Script (server-side, tidak kena CORS), hasilnya base64 diubah balik
// jadi Blob di sini untuk diserahkan ke DocumentPreviewer.
function base64ToBlob_(base64, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

async function beritaAcaraDriveFetcher_(fileId) {
  try {
    const result = await Api.getArsipFileContent(fileId);
    return { blob: base64ToBlob_(result.base64Data, result.mimeType), name: result.name };
  } catch (err) {
    return { error: err.message };
  }
}

const documentPreviewer = new DocumentPreviewer({
  driveFetcher: beritaAcaraDriveFetcher_,
  pdfWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  pdfCmapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/'
});

let _riwayatCache = [];
let _riwayatLoadedOnce = false;
let _riwayatFiltered = [];
let _riwayatPage = 1;
let _riwayatCurrentDetail = null;
const RIWAYAT_PAGE_SIZE = 15;

async function loadRiwayat() {
  const tbody = document.getElementById('riwayat-tbody');
  tbody.innerHTML = '<tr><td colspan="8"><div class="loading-row"><span class="spinner"></span> Memuat riwayat...</div></td></tr>';
  try {
    await ensureSettingsCache(); // dibutuhkan untuk merakit Nomor Surat lengkap di tabel/detail/PDF
    if (!_pegawaiLoadedOnce) await loadPegawai(); // dibutuhkan untuk mencetak Jabatan lengkap (unit kerja) & kolom KUA
    const data = await Api.getBeritaAcara();
    _riwayatCache = data || [];
    _riwayatLoadedOnce = true;
    populateRiwayatFilters();
    applyRiwayatFilters();
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="table-empty">Gagal memuat: ' + escapeHtml(err.message) + '</div></td></tr>';
    toast(err.message, 'error');
  }
}

function populateRiwayatFilters() {
  const tahunSelect = document.getElementById('riwayat-filter-tahun');
  if (tahunSelect.options.length <= 1) {
    const tahunSet = Array.from(new Set(_riwayatCache.map((r) => r.tahun).filter(Boolean))).sort().reverse();
    tahunSelect.innerHTML = '<option value="">Semua Tahun</option>' + tahunSet.map((t) => `<option value="${t}">${t}</option>`).join('');
  }
  // Filter Bulan & KUA statis (semua 12 bulan / 31 KUA selalu ditampilkan,
  // terlepas dari isi data saat ini) — konsisten dengan pola yang sudah ada
  // untuk filter Bulan. Keduanya diisi sekali lewat populateKuaSelect() /
  // baris di bawah, jadi di sini tidak perlu (dan tidak boleh) diisi ulang
  // berdasarkan _riwayatCache, supaya tidak konflik dengan pengisian awal itu.
  const bulanSelect = document.getElementById('riwayat-filter-bulan');
  if (bulanSelect.options.length <= 1) {
    bulanSelect.innerHTML = '<option value="">Semua Bulan</option>' + BULAN_ID.map((b, i) => `<option value="${i + 1}">${b}</option>`).join('');
  }
}

function riwayatNomorSortValue_(r) {
  return (parseInt(r.tahun, 10) || 0) * 1000 + (parseInt(r.nomorUrut, 10) || 0);
}

function riwayatFieldForSort_(r, key) {
  if (key === 'nomorUrut') return riwayatNomorSortValue_(r);
  if (key === 'tanggal') {
    return (parseInt(r.tahun, 10) || 0) * 10000 + ((BULAN_ID.indexOf(r.bln) + 1) || 0) * 100 + (parseInt(r.tgl, 10) || 0);
  }
  if (key === 'kua') return getKuaLabelForRecord_(r);
  return r[key];
}

let _riwayatSortKey = null; // null = urutan default (nomor terbaru dulu)
let _riwayatSortDir = 'desc';

function sortRiwayatBy(key) {
  if (_riwayatSortKey === key) {
    _riwayatSortDir = _riwayatSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    _riwayatSortKey = key;
    _riwayatSortDir = (key === 'nomorUrut' || key === 'tanggal') ? 'desc' : 'asc';
  }
  updateSortIndicators('riwayat-thead', _riwayatSortKey, _riwayatSortDir);
  _riwayatPage = 1;
  renderRiwayatPage();
}
setupSortableHeaders('riwayat-thead', sortRiwayatBy);

function applyRiwayatFilters() {
  const q = document.getElementById('riwayat-search').value.trim().toLowerCase();
  const tahunFilter = document.getElementById('riwayat-filter-tahun').value;
  const bulanFilter = document.getElementById('riwayat-filter-bulan').value;
  const kuaFilterEl = document.getElementById('riwayat-filter-kua');
  const kuaFilter = kuaFilterEl ? kuaFilterEl.value : '';

  _riwayatFiltered = _riwayatCache.filter((r) => {
    if (tahunFilter && r.tahun !== tahunFilter) return false;
    if (bulanFilter) {
      const targetMonth = (BULAN_ID[parseInt(bulanFilter, 10) - 1] || '').toUpperCase();
      if (!String(r.bln || '').toUpperCase().startsWith(targetMonth)) return false;
    }
    if (kuaFilter && getKuaLabelForRecord_(r) !== kuaFilter) return false;
    if (q) {
      const haystack = [r.noSurat, r.nomorUrut, r.pihakSatuNama, r.pihakKeduaNama, r.porporasi, getKuaLabelForRecord_(r)].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  _riwayatPage = 1;
  renderRiwayatPage();
}

document.getElementById('riwayat-search').addEventListener('input', applyRiwayatFilters);
document.getElementById('riwayat-filter-tahun').addEventListener('change', applyRiwayatFilters);
document.getElementById('riwayat-filter-bulan').addEventListener('change', applyRiwayatFilters);
document.getElementById('riwayat-filter-kua').addEventListener('change', applyRiwayatFilters);

function renderRiwayatPage() {
  const activeKey = _riwayatSortKey || 'nomorUrut';
  const activeDir = _riwayatSortKey ? _riwayatSortDir : 'desc';
  _riwayatFiltered.sort((a, b) => {
    const cmp = compareForSort(riwayatFieldForSort_(a, activeKey), riwayatFieldForSort_(b, activeKey));
    return activeDir === 'asc' ? cmp : -cmp;
  });

  const tbody = document.getElementById('riwayat-tbody');
  const totalPages = Math.max(Math.ceil(_riwayatFiltered.length / RIWAYAT_PAGE_SIZE), 1);
  if (_riwayatPage > totalPages) _riwayatPage = totalPages;
  const start = (_riwayatPage - 1) * RIWAYAT_PAGE_SIZE;
  const pageItems = _riwayatFiltered.slice(start, start + RIWAYAT_PAGE_SIZE);

  if (!pageItems.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="table-empty">Tidak ada Berita Acara yang cocok.</div></td></tr>';
  } else {
    tbody.innerHTML = pageItems.map((r) => `
      <tr>
        <td class="mono">${escapeHtml(pad3(parseInt(r.nomorUrut, 10)))}/${escapeHtml(r.tahun)}</td>
        <td>${escapeHtml(r.tgl)} ${escapeHtml(r.bln)} ${escapeHtml(r.tahun)}</td>
        <td>${escapeHtml(r.pihakSatuNama)}</td>
        <td>${escapeHtml(r.pihakKeduaNama)}</td>
        <td><span class="badge">${escapeHtml(getKuaLabelForRecord_(r) || '-')}</span></td>
        <td class="mono">${escapeHtml(r.porporasi || '-')}</td>
        <td>${r.linkArsip ? '<span class="badge" style="background:var(--color-primary-tint); color:var(--color-primary-dark);">Ada</span>' : '<span class="badge">Belum</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" type="button" data-lihat="${escapeHtml(r.nomorUrut)}|${escapeHtml(r.tahun)}" aria-label="Lihat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" type="button" data-hapus="${escapeHtml(r.nomorUrut)}|${escapeHtml(r.tahun)}" aria-label="Hapus">

              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('riwayat-pagination-info').textContent =
    `Menampilkan ${pageItems.length ? start + 1 : 0}–${start + pageItems.length} dari ${_riwayatFiltered.length} BA (halaman ${_riwayatPage}/${totalPages})`;
  document.getElementById('btn-riwayat-prev').disabled = _riwayatPage <= 1;
  document.getElementById('btn-riwayat-next').disabled = _riwayatPage >= totalPages;

  tbody.querySelectorAll('[data-lihat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parts = btn.getAttribute('data-lihat').split('|');
      openDetailModal(parts[0], parts[1]);
    });
  });
  tbody.querySelectorAll('[data-hapus]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parts = btn.getAttribute('data-hapus').split('|');
      handleDeleteBa(parts[0], parts[1]);
    });
  });
}

document.getElementById('btn-riwayat-prev').addEventListener('click', () => {
  if (_riwayatPage > 1) { _riwayatPage--; renderRiwayatPage(); }
});
document.getElementById('btn-riwayat-next').addEventListener('click', () => {
  const totalPages = Math.max(Math.ceil(_riwayatFiltered.length / RIWAYAT_PAGE_SIZE), 1);
  if (_riwayatPage < totalPages) { _riwayatPage++; renderRiwayatPage(); }
});

function handleDeleteBa(nomorUrut, tahun) {
  confirmAction(
    'Yakin ingin menghapus Berita Acara Nomor ' + pad3(parseInt(nomorUrut, 10)) + '/' + tahun +
    '? Tindakan ini tidak dapat dibatalkan. Arsip di Google Drive (jika ada) tidak ikut terhapus.',
    async () => {
      try {
        await Api.deleteBeritaAcara(nomorUrut, tahun);
        toast('Berita Acara berhasil dihapus.');
        await loadRiwayat();
        loadDashboard();
      } catch (err) {
        toast(err.message, 'error');
      }
    },
    'Hapus Berita Acara'
  );
}

function openDetailModal(nomorUrut, tahun) {
  const r = _riwayatCache.find((x) => String(x.nomorUrut) === String(nomorUrut) && x.tahun === tahun);
  if (!r) return;
  _riwayatCurrentDetail = r;

  document.getElementById('detail-ba-nomor').innerHTML =
    '<strong>Nomor ' + escapeHtml(pad3(parseInt(r.nomorUrut, 10))) + '/' + escapeHtml(r.tahun) + '</strong> — ' +
    escapeHtml(r.hari) + ', ' + escapeHtml(r.tgl) + ' ' + escapeHtml(r.bln) + ' ' + escapeHtml(r.tahun) + '<br>' +
    escapeHtml(buildNomorSuratLengkap(r.nomorUrut, r.blnSrt, r.tahun));

  document.getElementById('detail-ba-pihak-satu').innerHTML =
    '<strong>' + escapeHtml(r.pihakSatuNama) + '</strong><br>NIP. ' + escapeHtml(r.pihakSatuNip) + '<br>' +
    escapeHtml(r.pihakSatuJabatan) + '<br>' +
    '<span style="color:var(--color-text-faint);">Tempat Kerja: ' + escapeHtml(getTempatKerjaLabel_(r.pihakSatuNip, r.pihakSatuJabatan, 'Bimas Islam')) + '</span><br>' +
    escapeHtml(resolveAlamatLengkapPihakSatu_(r));
  document.getElementById('detail-ba-pihak-kedua').innerHTML =
    '<strong>' + escapeHtml(r.pihakKeduaNama) + '</strong><br>NIP. ' + escapeHtml(r.pihakKeduaNip) + '<br>' +
    escapeHtml(r.pihakKeduaJabatan) + '<br>' +
    '<span style="color:var(--color-text-faint);">Tempat Kerja: ' + escapeHtml(getTempatKerjaLabel_(r.pihakKeduaNip, r.pihakKeduaJabatan, 'KUA')) + '</span><br>' +
    escapeHtml(resolveAlamatLengkapPihakKedua_(r));
  document.getElementById('detail-ba-sarana').innerHTML =
    'Buku NA: ' + escapeHtml(r.banyakNaBuku || '-') + ' &middot; N: ' + escapeHtml(r.banyakN || '-') +
    ' &middot; NB: ' + escapeHtml(r.banyakNb || '-') + '<br>Porporasi: ' + escapeHtml(r.porporasi || '-') +
    (r.noSeri ? ' &middot; No. Seri: ' + escapeHtml(r.noSeri) : '');

  document.getElementById('detail-ba-upload-result').innerHTML = '';
  document.getElementById('detail-ba-arsip-file').value = '';
  const existingEl = document.getElementById('detail-ba-arsip-existing');
  if (r.linkArsip) {
    existingEl.style.display = 'block';
    document.getElementById('detail-ba-arsip-link').href = r.linkArsip;
    document.getElementById('detail-ba-arsip-preview').onclick = (e) => {
      e.preventDefault();
      const label = 'BA ' + pad3(parseInt(r.nomorUrut, 10)) + '/' + r.tahun + ' — Arsip';
      documentPreviewer.open(r.linkArsip, label);
    };
    document.getElementById('detail-ba-arsip-hapus').onclick = (e) => {
      e.preventDefault();
      handleHapusArsip(r);
    };
  } else {
    existingEl.style.display = 'none';
  }

  openModal('modal-detail-ba');
}

function handleHapusArsip(r) {
  confirmAction(
    'Yakin ingin menghapus arsip Berita Acara Nomor ' + pad3(parseInt(r.nomorUrut, 10)) + '/' + r.tahun +
    '? File di Google Drive akan ikut terhapus permanen.',
    async () => {
      try {
        await Api.deleteArsip(r.nomorUrut, r.tahun);
        toast('Arsip berhasil dihapus.');
        r.linkArsip = ''; // objek yang sama persis dgn entri di _riwayatCache
        document.getElementById('detail-ba-arsip-existing').style.display = 'none';
        renderRiwayatPage();
      } catch (err) {
        toast(err.message, 'error');
      }
    },
    'Hapus Arsip'
  );
}

document.getElementById('btn-detail-download-pdf').addEventListener('click', async () => {
  if (!_riwayatCurrentDetail) return;
  const btn = document.getElementById('btn-detail-download-pdf');
  setButtonLoading(btn, true, 'Menyiapkan PDF...');
  try {
    await downloadBeritaAcaraPdf(_riwayatCurrentDetail);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

document.getElementById('btn-detail-upload-arsip').addEventListener('click', async () => {
  if (!_riwayatCurrentDetail) return;
  const fileInput = document.getElementById('detail-ba-arsip-file');
  const file = fileInput.files[0];
  const resultEl = document.getElementById('detail-ba-upload-result');
  if (!file) { toast('Pilih file terlebih dahulu.', 'error'); return; }
  if (file.size > 15 * 1024 * 1024) {
    toast('Ukuran file melebihi 15MB. Kompres dulu atau pindai dengan resolusi lebih rendah.', 'error');
    return;
  }
  const btn = document.getElementById('btn-detail-upload-arsip');
  setButtonLoading(btn, true, 'Mengunggah...');
  try {
    const base64Data = await fileToBase64(file);
    const result = await Api.uploadArsip({
      nomorUrut: _riwayatCurrentDetail.nomorUrut,
      tahun: _riwayatCurrentDetail.tahun,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64Data: base64Data
    });
    resultEl.innerHTML = '<div class="inline-note inline-note--success">' + ICON_CHECK +
      '<span>Berhasil diunggah — <a href="' + result.fileUrl + '" target="_blank" rel="noopener">buka file</a></span></div>';
    toast('Arsip berhasil diunggah ke Google Drive.');
    _riwayatCurrentDetail.linkArsip = result.fileUrl; // objek yang sama persis dgn entri di _riwayatCache
    document.getElementById('detail-ba-arsip-existing').style.display = 'block';
    document.getElementById('detail-ba-arsip-link').href = result.fileUrl;
    renderRiwayatPage();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// ============================================================================
// 9. MIGRASI / SINKRONISASI MANUAL DARI HALAMAN PENGATURAN
// ============================================================================
document.getElementById('btn-run-migration').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run-migration');
  const resultEl = document.getElementById('migration-result');
  setButtonLoading(btn, true, 'Menjalankan migrasi...');
  resultEl.style.display = 'none';
  try {
    const result = await Api.runMigration();
    resultEl.style.display = 'block';
    let html = '<div class="card" style="background: var(--color-primary-tint); border-color: var(--color-primary); box-shadow:none; padding: var(--sp-4);">' +
      '<strong>Migrasi selesai.</strong> ' + result.added + ' pegawai baru ditambahkan, ' +
      result.updated + ' pegawai diperbarui. Nomor Terakhir sekarang: <span class="mono">' + result.lastNumber + '</span>.';
    if (result.warnings && result.warnings.length) {
      html += '<div style="margin-top: var(--sp-2);"><strong>Peringatan kualitas data (' + result.warnings.length + '):</strong>' +
        '<ul style="margin-top:4px;">' +
        result.warnings.map((w) => '<li style="font-size: var(--fs-xs); padding: 2px 0;">' + escapeHtml(w) + '</li>').join('') +
        '</ul></div>';
    }
    html += '</div>';
    resultEl.innerHTML = html;
    toast('Migrasi berhasil dijalankan.');
    loadDashboard();
    if (_pegawaiLoadedOnce) loadPegawai();
    loadSettings();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// ============================================================================
// 10. SINKRONISASI MANUAL (tombol di header)
// ============================================================================
document.getElementById('btn-sync').addEventListener('click', async () => {
  const btn = document.getElementById('btn-sync');
  setButtonLoading(btn, true, 'Menyinkronkan...');
  try {
    const active = document.querySelector('.page.is-active').dataset.page;
    if (active === 'dashboard') await loadDashboard();
    else if (active === 'pegawai') await loadPegawai();
    else if (active === 'pengaturan') await loadSettings();
    else if (active === 'buat-ba') await loadBuatBaPage();
    else if (active === 'riwayat') await loadRiwayat();
    else await loadDashboard();
    toast('Data berhasil disinkronkan.');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
});

// ============================================================================
// 11. INISIALISASI
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('today-date').textContent = formatIndonesianDateLong(new Date());
  populateKuaSelect();
  loadDashboard();
});