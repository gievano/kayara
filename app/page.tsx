"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LayeredText } from "@/components/ui/layered-text";
import { getAvailableExams, getQuestionsByExam } from "@/lib/questions";

const HERO_LINES = [
  { top: "\u00A0", bottom: "日本語" },
  { top: "日本語", bottom: "練習" },
  { top: "練習", bottom: "集中" },
  { top: "集中", bottom: "合格" },
  { top: "合格", bottom: "未来" },
  { top: "未来", bottom: "KAYARA" },
  { top: "KAYARA", bottom: "\u00A0" },
];

const LEVELS = [
  { id: "N5", name: "Dasar", description: "Mulai dari kosakata, pola kalimat, dan pemahaman paling fundamental.", minutes: 90 },
  { id: "N4", name: "Menengah awal", description: "Bangun ketahanan membaca dan grammar untuk situasi sehari-hari.", minutes: 115 },
  { id: "N3", name: "Menengah", description: "Jembatan penting menuju teks dan percakapan yang lebih kompleks.", minutes: 140 },
  { id: "N2", name: "Menengah atas", description: "Latihan intensif untuk bahasa akademik dan profesional.", minutes: 155 },
  { id: "N1", name: "Mahir", description: "Uji nuansa, kecepatan, dan pemahaman bahasa Jepang tingkat lanjut.", minutes: 165 },
] as const;

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

const reveal = (delay: number, reduced: boolean) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
      };

export default function Home() {
  const reduced = Boolean(useReducedMotion());
  const totals = Object.fromEntries(
    LEVELS.map(({ id }) => {
      const questions = getQuestionsByExam("all", id);
      const exams = getAvailableExams(id);
      return [id, { questions: questions.length, exams: exams.length }];
    }),
  ) as Record<(typeof LEVELS)[number]["id"], { questions: number; exams: number }>;
  const grandTotal = LEVELS.reduce((sum, { id }) => sum + totals[id].questions, 0);
  const grandExams = LEVELS.reduce((sum, { id }) => sum + totals[id].exams, 0);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="brand" aria-label="Kayara, halaman utama">
            <span className="brand__mark" aria-hidden="true">か</span>
            <span className="brand__name">Kayara</span>
            <span className="brand__note">Persiapan JLPT N5—N1</span>
          </Link>
          <Link href="/exam/n5" className="button-primary button-small">
            Mulai latihan <ArrowIcon />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <motion.div {...reveal(0.05, reduced)} className="hero__copy">
            <h1 className="hero__title">
              Latihan yang tenang.
              <em>Hasil yang nyata.</em>
            </h1>
            <p className="hero__lead">
              Simulasi JLPT dari N5 hingga N1 dengan urutan bagian yang mengikuti ujian. Pilih mode ujian untuk fokus penuh atau latihan untuk belajar tanpa tekanan waktu.
            </p>
            <div className="hero__action">
              <motion.div whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { y: 1 }}>
                <Link href="/exam/n5" className="button-primary">
                  Pilih level pertama <ArrowIcon />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.aside {...reveal(0.14, reduced)} className="hero__aside" aria-label="Ringkasan koleksi soal">
            <div className="hero__layered" aria-hidden="true">
              <LayeredText
                lines={HERO_LINES}
                fontSize="clamp(44px, 4.8vw, 72px)"
                fontSizeMd="30px"
                lineHeight={82}
                lineHeightMd={50}
              />
            </div>
            <p className="hero__aside-copy">Berlatih seperti hari ujian, memahami seperti saat belajar.</p>
            <div className="hero__meta">
              <span>{grandTotal} soal</span>
              <span>{grandExams} paket</span>
              <span>4 bagian ujian</span>
            </div>
          </motion.aside>
        </section>

        <section className="editorial-section page-frame" aria-labelledby="level-heading">
          <motion.div {...reveal(0.2, reduced)} className="section-heading">
            <h2 id="level-heading">Pilih tingkatmu</h2>
            <p>Setiap level memuat paket tersendiri, skor per bagian, dan progres yang tersimpan selama sesi berjalan.</p>
          </motion.div>

          <motion.div
            className="level-list"
            initial={reduced ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {LEVELS.map((level) => (
              <motion.div
                key={level.id}
                variants={reduced ? {} : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
                whileHover={reduced ? undefined : { x: 4 }}
              >
                <Link href={`/exam/${level.id.toLowerCase()}`} className="level-card">
                  <span className="level-card__id">{level.id}</span>
                  <span className="level-card__name">{level.name}</span>
                  <span className="level-card__description">{level.description}</span>
                  <span className="level-card__meta">{totals[level.id].exams} paket · {totals[level.id].questions} soal · {level.minutes} menit</span>
                  <span className="level-card__arrow"><ArrowIcon /></span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-frame">
          <span>Kayara — ruang latihan bahasa Jepang.</span>
          <span>Moji Goi · Bunpou Dokkai · Choukai</span>
        </div>
      </footer>
    </div>
  );
}
