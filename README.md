# RUDAL JITU

Rudal Jitu adalah aplikasi manajemen data KPJ berbasis web yang dibangun menggunakan **Angular 21** (menggantikan Next.js sesuai dengan lingkungan eksekusi AI Studio), **Tailwind CSS**, **Firebase**, dan **SheetJS**.

## Fitur Utama
- **Login Dua Mode**: Pengguna dengan Token & Admin dengan Password (`12445`).
- **Dashboard Admin**:
  - Manajemen dan Pembuatan Token Acak.
  - Upload file Excel `.xlsx` dalam jumlah besar.
  - Penyimpanan persisten di Cloud Firestore.
  - Fitur "Danger Zone" untuk menghapus seluruh data jika dibutuhkan.
- **Pencarian Canggih**:
  - Mencocokkan 2 digit pertama NO.KPJ (tahun) dengan seluruh riwayat data admin.
  - Tampilan antrean hasil dinamis dengan auto-scroll dan animasi.

## Prasyarat
- Node.js versi 20+
- Akun Firebase dengan Firestore yang aktif.

## Konfigurasi Firebase
Aplikasi ini menggunakan Firebase Firestore. 
1. Buat project baru di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Firestore Database**.
3. Sesuaikan *Security Rules* Firestore Anda:
   ```rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true; // Ubah sesuai kebutuhan keamanan untuk produksi
       }
     }
   }
   ```
4. Kunci akses Firebase (`firebaseConfig`) sudah berada di file `src/app/firebase.ts`. **PERHATIAN:** Untuk tahap *production*, sangat disarankan menggunakan `.env` untuk menyimpan konfigurasi ini dan tidak menyertakannya di dalam repository.

## Panduan Menjalankan Secara Lokal
1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm start
   ```
3. Buka browser dan arahkan ke `http://localhost:3000`.

## Panduan Deployment ke Vercel
1. Unggah *repository* proyek Anda ke **GitHub**.
2. Masuk ke [Vercel](https://vercel.com/) dan buat project baru dari repository GitHub Anda.
3. Vercel akan mendeteksi *framework* Angular secara otomatis.
4. (Opsional) Masukkan Environment Variables Anda di tab *Environment Variables* Vercel jika Anda mengubah pengaturan Firebase agar bergantung pada `.env`.
5. Klik **Deploy**.

## Format Excel
Pastikan file Excel (`.xlsx`) memiliki nama kolom (header) berikut (penulisan tidak sensitif/bebas):
- NO.KPJ (atau KPJ, NOKPJ)
- NIK
- NAMA
- TGL LAHIR (atau TANGGAL LAHIR, TGLLAHIR)

Kolom lainnya dapat ditambahkan dan tidak akan mengganggu proses impor.
