/**
 * config.js
 * ============================================================================
 * SATU-SATUNYA file di sisi frontend yang perlu diubah saat memasang
 * aplikasi ini, atau saat memindahkannya ke deployment Apps Script lain.
 *
 * WEB_APP_URL
 *   URL hasil Deploy > New deployment > Web app dari project Apps Script
 *   (appscript/Code.gs). Contoh:
 *   "https://script.google.com/macros/s/AKfycb.../exec"
 *
 * ID Spreadsheet, folder arsip Drive, dan konfigurasi lain yang sifatnya
 * server-side semuanya ada di BLOK KONFIGURASI paling atas appscript/Code.gs
 * — bukan di sini, supaya semua identifier penting terkumpul satu tempat.
 * ============================================================================
 */
const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwLPj6nJLoyJz4doz7B1656Fp9EfkVi9ZQZ6n2ghSXrmjOFhKTyELZmqfN-yFburdBq/exec"
};
