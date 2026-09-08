/**
 * pdf.js
 * ============================================================================
 * Menghasilkan PDF Berita Acara Serah Terima Sarana Administrasi NR yang
 * tampilannya mengikuti contoh dokumen resmi (kop surat, tabel, tanda
 * tangan). Dipakai dari halaman Riwayat (tombol Download PDF / Lihat).
 *
 * Bergantung pada jsPDF + jsPDF-AutoTable (dimuat via CDN di index.html)
 * dan pada beberapa fungsi/konstanta global dari script.js: ROMAN_NUMERALS,
 * buildNomorSuratLengkap(), pad3(), _settingsCache. File ini HARUS dimuat
 * setelah script.js.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// Loader jsPDF/AutoTable dengan fallback multi-CDN.
// ----------------------------------------------------------------------------
// index.html sudah memuat kedua pustaka lewat <script> statis (cdnjs) supaya
// siap lebih cepat — tapi beberapa jaringan kantor/instansi memblokir domain
// CDN tertentu, jadi kalau itu gagal (window.jspdf belum ada saat tombol
// diklik), fungsi ini mencoba memuat ULANG secara dinamis dari cdnjs lalu
// jsdelivr (penyedia infrastruktur berbeda) sebelum benar-benar menyerah.
function loadScriptOnce_(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat ' + url));
    document.head.appendChild(script);
  });
}

function hasAutoTable_() {
  return !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && typeof window.jspdf.jsPDF.API.autoTable === 'function');
}

async function ensureJsPdfLoaded_() {
  if (hasAutoTable_()) return; // sudah lengkap (dari <script> statis di index.html atau percobaan sebelumnya)

  if (!window.jspdf) {
    const jsPdfSources = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];
    for (const src of jsPdfSources) {
      try { await loadScriptOnce_(src); if (window.jspdf) break; } catch (e) { /* coba sumber berikutnya */ }
    }
    if (!window.jspdf) {
      throw new Error('Gagal memuat pustaka jsPDF dari cdnjs.cloudflare.com maupun cdn.jsdelivr.net. ' +
        'Kemungkinan jaringan ini memblokir kedua domain tsb — coba jaringan lain, atau minta admin IT membuka akses ke keduanya.');
    }
  }

  if (!hasAutoTable_()) {
    const autoTableSources = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js'
    ];
    for (const src of autoTableSources) {
      try { await loadScriptOnce_(src); if (hasAutoTable_()) break; } catch (e) { /* coba sumber berikutnya */ }
    }
    if (!hasAutoTable_()) {
      throw new Error('Gagal memuat pustaka jsPDF-AutoTable dari cdnjs.cloudflare.com maupun cdn.jsdelivr.net.');
    }
  }
}

// Kop surat butuh logo Kemenag. Dicoba berurutan, paling andal duluan:
//
//  1. Konstanta LOGO_BASE64 dari logo-data.js — dihasilkan sekali lewat
//     assets/logo-converter.html. Ini PALING ANDAL karena logo sudah jadi
//     bagian dari kode (bukan file yang perlu dimuat saat runtime), jadi
//     tidak mungkin kena masalah file:// apa pun. Ini cara yang disarankan
//     — kalau logo tidak muncul, inilah yang seharusnya dijalankan dulu.
//  2. fetch() ke assets/logo-kemenag.png — TERBUKTI selalu diblokir CORS
//     oleh Chrome dkk. saat aplikasi dibuka lewat file:// ("Cross origin
//     requests are only supported for protocol schemes: chrome, ... " —
//     skema "file" memang tidak masuk daftar yang diizinkan sama sekali).
//     Jadi langkah ini SENGAJA DILEWATI kalau halaman sedang berjalan dari
//     file://, supaya tidak memunculkan error CORS di console yang sudah
//     pasti gagal — hanya dicoba kalau aplikasi suatu saat di-hosting via
//     http/https, di mana fetch() ini justru bisa berhasil.
//  3. <img> + canvas — cara paling lama, tapi browser tertentu memperlakukan
//     tiap URL file:// sebagai origin unik sehingga canvas.toDataURL() bisa
//     gagal walau gambarnya berhasil TAMPIL sebagai <img>.
//
// Kalau ketiganya gagal, mengembalikan null (bukan melempar error) supaya
// PDF tetap bisa dibuat tanpa logo daripada gagal total.
async function loadLogoAsDataUrl_(path) {
  if (typeof LOGO_BASE64 !== 'undefined' && LOGO_BASE64) {
    const dims = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = LOGO_BASE64;
    });
    if (dims) return { dataUrl: LOGO_BASE64, width: dims.width, height: dims.height };
  }

  if (window.location.protocol !== 'file:') {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('gagal membaca blob logo'));
          reader.readAsDataURL(blob);
        });
        const dims = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        });
        if (dims) return { dataUrl: dataUrl, width: dims.width, height: dims.height };
      }
    } catch (e) {
      // lanjut ke cara 3
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      } catch (e) {
        resolve(null); // kedua cara gagal -> PDF tetap dibuat tanpa logo
      }
    };
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

function pdfWriteWrapped_(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

// Menulis baris "Label : Nilai" sejajar kolon, meniru gaya contoh dokumen
// ("Nama : TIEN JUNIARSIH", "NIP. : 197906...").
function pdfWriteFieldLine_(doc, label, value, x, y, labelWidth) {
  doc.text(label, x, y);
  doc.text(':', x + labelWidth, y);
  doc.text(String(value === undefined || value === null || value === '' ? '-' : value), x + labelWidth + 3, y);
  return y + 5;
}

// Data Pegawai menyimpan Jabatan bersih ("JFU") terpisah dari unit
// kerjanya (Kategori/KUA) — pemisahan itu perlu untuk combobox & filter
// dropdown, tapi dokumen resmi perlu mencetak keduanya sekaligus, persis
// seperti data lama ("JFU Pada Seksi Bimas Islam"). Fungsi ini merakitnya
// kembali KHUSUS untuk dicetak, tanpa mengubah data Pegawai yang tersimpan.
//
// PERBAIKAN BUG: sebagian data Jabatan (entri lama/migrasi atau yang
// diketik manual) TERNYATA sudah menyertakan nama unit kerjanya sendiri,
// mis. "Penghulu KUA Patrol" atau "JFU Pada Seksi Bimas Islam". Kalau
// akhirannya ditempel begitu saja tanpa dicek, hasilnya dobel ("...Pada
// Seksi Bimas Islam Pada Seksi Bimas Islam"). Jadi sebelum menempelkan
// akhiran, cek dulu apakah teks jabatan SUDAH menyebut unit kerja terkait
// — kalau sudah, biarkan apa adanya.
function formatJabatanUntukCetak_(nip, jabatanMentah) {
  const cache = (typeof _pegawaiCache !== 'undefined') ? _pegawaiCache : [];
  const pegawai = cache.find((p) => p.nip === nip);
  const jabatan = jabatanMentah || '-';
  if (!pegawai) return jabatan;
  const jabatanUpper = jabatan.toUpperCase();
  if (pegawai.kategori === 'Bimas Islam') {
    if (jabatanUpper.indexOf('BIMAS ISLAM') !== -1) return jabatan;
    return jabatan + ' Pada Seksi Bimas Islam';
  }
  if (pegawai.kategori === 'KUA') {
    const kua = pegawai.kua || '';
    // Hanya cek nama kecamatan KUA-nya sendiri (bukan cek kata "KUA" secara
    // umum) — supaya jabatan bersih yang memang mengandung kata "KUA" apa
    // adanya (mis. "Operator KUA") tetap ditempeli lokasi seperti biasa.
    if (kua && jabatanUpper.indexOf(kua.toUpperCase()) !== -1) return jabatan;
    return jabatan + ' Pada KUA ' + kua;
  }
  return jabatan;
}

/**
 * record: objek dari Api.getBeritaAcara() (satu baris) — lihat bentuknya di
 * getBeritaAcara() pada Code.gs.
 * Mengembalikan instance jsPDF (dipanggil dari script.js untuk .save() atau
 * diambil sebagai blob untuk diunggah ke Drive).
 */
async function generateBeritaAcaraPdf(record) {
  await ensureJsPdfLoaded_();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageWidth = 210;
  const marginLeft = 20, marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const settings = _settingsCache || {};
  let y = 12;

  const logo = await loadLogoAsDataUrl_('assets/logo-kemenag.png');

// ---------------- KOP SURAT ----------------
if (logo) {
  const maxLogoW = 24, maxLogoH = 22;
  let logoW = maxLogoW;
  let logoH = logoW * (logo.height / logo.width);

  if (logoH > maxLogoH) {
    logoH = maxLogoH;
    logoW = logoH * (logo.width / logo.height);
  }

  doc.addImage(logo.dataUrl, 'PNG', marginLeft, y - 3, logoW, logoH);
}

const headerX = pageWidth / 2 + 8;

// Nama instansi
doc.setFont('times', 'bold');
doc.setFontSize(13);
doc.text(
  'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  headerX, y,
  { align: 'center' }
);

y += 5;
doc.setFontSize(13);
doc.text(
  'KANTOR KEMENTERIAN AGAMA KABUPATEN INDRAMAYU',
  headerX, y,
  { align: 'center' }
);

// Alamat
y += 5;
doc.setFont('times', 'normal');
doc.setFontSize(11);
doc.text(
  'Jalan Olahraga Nomor 3 Indramayu 45213',
  headerX, y,
  { align: 'center' }
);

y += 4.5;
doc.text(
  'Telp. (0234) 272033, 272073, Faximile (0234) 272033',
  headerX, y,
  { align: 'center' }
);

// Email
y += 4.5;
doc.setFont('times', 'bolditalic');
doc.setFontSize(11);
doc.text(
  'Email : bimasindramayu@gmail.com',
  headerX, y,
  { align: 'center' }
);

y += 3;

  doc.setLineWidth(0.8);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 1.1;
  doc.setLineWidth(0.2);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // ---------------- JUDUL ----------------
  const nomorLengkap = buildNomorSuratLengkap(record.nomorUrut, record.blnSrt, record.tahun, settings);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.text('BERITA  ACARA SERAH TERIMA SARANA ADMINISTRASI NR', pageWidth / 2, y, { align: 'center' });
  y += 5.5;
  doc.setFontSize(12);
  doc.text('NOMOR : ' + nomorLengkap, pageWidth / 2, y, { align: 'center' });
  y += 9;

  // ---------------- PEMBUKA ----------------
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const pembuka = 'Pada hari ini ' + record.hari + ' tanggal ' + record.tgl + ' Bulan ' + record.bln +
    ' tahun ' + record.tahun + ', kami yang bertanda tangan di bawah ini :';
  y = pdfWriteWrapped_(doc, pembuka, marginLeft, y, contentWidth, 5) + 3;

  // ---------------- PIHAK PERTAMA ----------------
  y = pdfWriteFieldLine_(doc, 'Nama', record.pihakSatuNama, marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'NIP.', record.pihakSatuNip, marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'Jabatan', formatJabatanUntukCetak_(record.pihakSatuNip, record.pihakSatuJabatan), marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'Alamat', record.pihakSatuAlamat, marginLeft, y, 22);
  y += 3;
  doc.text('SELANJUTNYA DISEBUT PIHAK PERTAMA :', marginLeft, y);
  y += 7;

  // ---------------- PIHAK KEDUA ----------------
  y = pdfWriteFieldLine_(doc, 'Nama', record.pihakKeduaNama, marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'NIP.', record.pihakKeduaNip, marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'Jabatan', formatJabatanUntukCetak_(record.pihakKeduaNip, record.pihakKeduaJabatan), marginLeft, y, 22);
  y = pdfWriteFieldLine_(doc, 'Alamat', record.pihakKeduaAlamat, marginLeft, y, 22);
  y += 3;
  doc.text('SELANJUTNYA DISEBUT PIHAK KEDUA .', marginLeft, y);
  y += 8;

  doc.text('PIHAK PERTAMA menyerahkan kepada PIHAK KEDUA berupa sarana NR sebanyak :', marginLeft, y);
  y += 4;

  // ---------------- TABEL ----------------
  // Struktur baru per arahan langsung: satu baris PER KOMPONEN (NA/N/NB —
  // komponen DN sudah tidak dipakai lagi), bukan satu baris dengan kolom
  // terpisah untuk tiap komponen seperti template lama. "Pasang" tidak
  // pernah tercatat di data manapun untuk komponen apa pun, jadi selalu
  // "-"; nilai yang diinput selalu masuk ke sub-kolom "Buku". Seri & Nomor
  // Porporasi hanya dicetak SEKALI, di baris pertama yang muncul (nilainya
  // memang satu untuk seluruh BA, bukan per komponen) — baris berikutnya
  // "-". Komponen dengan nilai kosong/nol tidak dibuatkan barisnya sama
  // sekali (kalau cuma NA yang diisi, tabel hanya 1 baris).
  const komponenRows = [];
  if (record.banyakNaBuku) komponenRows.push({ label: 'NA', jumlah: record.banyakNaBuku });
  if (record.banyakN) komponenRows.push({ label: 'N', jumlah: record.banyakN });
  if (record.banyakNb) komponenRows.push({ label: 'NB', jumlah: record.banyakNb });
  if (!komponenRows.length) komponenRows.push({ label: '-', jumlah: '-' });

  const tableBody = komponenRows.map((k, i) => [
    String(i + 1),
    k.label,
    '-',
    String(k.jumlah),
    i === 0 ? (record.noSeri || '-') : '-',
    i === 0 ? (record.porporasi || '-') : '-',
    '-'
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: marginLeft, right: marginRight },
    styles: { font: 'times', fontSize: 10, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
    theme: 'grid',
    head: [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Komponen', rowSpan: 2 },
        { content: 'Banyaknya', colSpan: 2 },
        { content: 'Seri', rowSpan: 2 },
        { content: 'Nomor Porporasi', rowSpan: 2 },
        { content: 'Ket', rowSpan: 2 }
      ],
      [
        { content: 'Pasang' }, { content: 'Buku' }
      ]
    ],
    body: tableBody
  });
  y = doc.lastAutoTable.finalY + 6;

  // ---------------- PENUTUP ----------------
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  y = pdfWriteWrapped_(doc, 'PIHAK KEDUA telah menerima barang tersebut sesuai dengan jumlah dan kondisi sebagaimana di atas.', marginLeft, y, contentWidth, 5) + 3;
  y = pdfWriteWrapped_(doc, 'Demikian Berita Acara serah terima ini dibuat rangkap 2 (dua) selanjutnya ditandatangani oleh PIHAK-PIHAK yang berkepentingan untuk dipergunakan sebagaimana mestinya.', marginLeft, y, contentWidth, 5) + 10;

  // Pindah halaman kalau ruang tanda tangan tidak cukup lagi.
  if (y > 250) { doc.addPage(); y = 20; }

  // ---------------- TANDA TANGAN ----------------
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const colRightX = pageWidth / 2 + 10;
  doc.text('Yang menerima,', marginLeft, y);
  doc.text('Yang menyerahkan,', colRightX, y);
  y += 5;
  doc.text('PIHAK KEDUA', marginLeft, y);
  doc.text('PIHAK PERTAMA', colRightX, y);
  y += 22;
  doc.setFont('times', 'bold');
  doc.text(String(record.pihakKeduaNama || ''), marginLeft, y);
  doc.text(String(record.pihakSatuNama || ''), colRightX, y);
  y += 5;
  doc.setFont('times', 'normal');
  doc.text('NIP. ' + record.pihakKeduaNip, marginLeft, y);
  doc.text('NIP. ' + record.pihakSatuNip, colRightX, y);
  y += 14;

  // ---------------- MENGETAHUI ----------------
  doc.text('Mengetahui,', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('Kepala Seksi Bimas Islam,', pageWidth / 2, y, { align: 'center' });
  y += 22;
  doc.setFont('times', 'bold');
  doc.text(String(record.kasiNama || ''), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('times', 'normal');
  doc.text('NIP. ' + record.kasiNip, pageWidth / 2, y, { align: 'center' });

  return doc;
}

async function downloadBeritaAcaraPdf(record) {
  const doc = await generateBeritaAcaraPdf(record);
  const fileName = 'BA_' + pad3(parseInt(record.nomorUrut, 10)) + '_' + record.tahun + '.pdf';
  doc.save(fileName);
}