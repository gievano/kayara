# Kayara

Ruang latihan bahasa Jepang untuk persiapan JLPT dari N5 sampai N1. Aplikasi ini mengikuti urutan bagian ujian yang sebenarnya: Moji Goi (kosakata), Bunpou Dokkai (grammar dan membaca), lalu Choukai (mendengar). Ada dua cara berlatih, mode ujian dengan timer dan urutan terkunci, atau mode latihan yang bebas berpindah antar bagian.

## Fitur

- Soal asli JLPT dari 2010 hingga 2025, total 9.946 soal untuk lima level.
- Dua mode: ujian (waktu berjalan, urutan bagian sesuai ujian) dan latihan (tanpa tekanan waktu).
- Skor per bagian dan progres yang tersimpan selama sesi berjalan.
- Bagian Choukai memuat audio dan gambar soal yang tersedia di data.
- Desain bergaya editorial Jepang, hangat dan tenang, dengan dukungan gerakan halus Framer Motion dan GSAP.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion untuk transisi dan animasi antar bagian
- GSAP untuk efek teks di halaman depan
- pnpm sebagai package manager

## Mulai

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:3000`. Halaman depan menampilkan pilihan level; setiap level membuka daftar paket ujian dan soal.

Untuk build produksi:

```bash
pnpm build
pnpm start
```

## Struktur

```
app/
  page.tsx                 halaman depan, pilihan level
  exam/[level]/            daftar paket per level
  exam/[level]/[year]/     halaman ujian dan client exam
components/ui/
  layered-text.tsx         efek teks hero
lib/
  questions.ts             akses data soal
  score.ts                 perhitungan skor
data/
  questions.json           bank soal
scripts/
  scrape-ten.mjs           pengambilan soal dari situs ten-jlpt
  generate-local.mjs       generator soal dari PDF lokal
public/audio/              file audio (diabaikan oleh git)
```

## Data soal

Bank soal disimpan sebagai satu file JSON di `data/questions.json`. Data mencakup level, tahun, bagian, opsi jawaban, kunci, penjelasan, dan tautan audio atau gambar untuk bagian Choukai. Script di `scripts/` menghasilkan data dari PDF lokal dan mengambil soal dari situs ten-jlpt.

File MP3 tidak ikut di-commit. Audio Choukai diputar lewat tautan yang tersimpan di file JSON, sehingga repositori tetap ringan dan build di Vercel berjalan cepat.
