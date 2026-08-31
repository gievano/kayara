"use client";

import Link from "next/link";
import { use } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { countBySectionForExam, getAvailableExams, getLevelMeta } from "@/lib/questions";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type Level = (typeof LEVELS)[number];

function isLevel(value: string): value is Level {
  return LEVELS.includes(value as Level);
}

function formatExam(code: string) {
  const match = code.match(/^(\d{2})_(\d{4})$/);
  if (match) {
    const months: Record<string, string> = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des" };
    return `${months[match[1]] ?? match[1]} ${match[2]}`;
  }
  if (code.startsWith("test_")) return `Test ${code.split("_")[1]}`;
  return code;
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params);
  const reduced = Boolean(useReducedMotion());
  const candidate = level.toUpperCase();

  if (!isLevel(candidate)) {
    return (
      <main className="page-frame page-main">
        <div className="empty-state">
          <h1>Level tidak ditemukan</h1>
          <p>Level yang kamu cari belum tersedia.</p>
          <Link href="/exam/n5" className="button-primary">Pilih N5</Link>
        </div>
      </main>
    );
  }

  const exams = getAvailableExams(candidate);
  const levelMeta = getLevelMeta(candidate);
  const allQuestions = { length: levelMeta?.total ?? 0 };
  const allSections = levelMeta?.sections ?? { vocab: 0, grammar: 0, reading: 0, listening: 0 };

  return (
    <main className="page-frame page-main">
      <motion.nav initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Kayara</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">JLPT {candidate}</span>
      </motion.nav>

      <motion.section
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="page-intro"
      >
        <h1>JLPT {candidate}<br />pilih paket.</h1>
        <div className="page-intro__details">
          <p>Kerjakan dalam urutan Moji Goi, Bunpou Dokkai, lalu Choukai. Mode ujian menjaga ritme tes; mode latihan membuka pembahasan tanpa timer.</p>
          <div className="stat-line">
            <span>{exams.length} paket</span>
            <span>{allQuestions.length} soal</span>
            <span>progres tersimpan otomatis</span>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="packet-grid"
        aria-label={`Paket JLPT ${candidate}`}
        initial={reduced ? false : "hidden"}
        animate="visible"
        variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } }}
      >
        <motion.article variants={reduced ? {} : cardVariants} whileHover={reduced ? undefined : { y: -3 }} className="packet-card packet-card--featured">
          <div className="packet-card__top">
            <span className="tag">Campuran</span>
            <span className="tag">{allQuestions.length} soal</span>
          </div>
          <h2>Semua paket {candidate}</h2>
          <p>{exams.length} paket dalam satu maraton · vocab {allSections.vocab} · grammar {allSections.grammar} · reading {allSections.reading} · listening {allSections.listening}</p>
          <div className="packet-card__actions">
            <Link href={`/exam/${candidate.toLowerCase()}/all?mode=exam`} className="button-primary button-small">Mode ujian</Link>
            <Link href={`/exam/${candidate.toLowerCase()}/all?mode=practice`} className="button-secondary button-small">Latihan</Link>
          </div>
        </motion.article>

        {exams.map((code) => {
          const sections = countBySectionForExam(candidate, code);
          const questions = { length: sections.vocab + sections.grammar + sections.reading + sections.listening };
          return (
            <motion.article key={code} variants={reduced ? {} : cardVariants} whileHover={reduced ? undefined : { y: -3 }} className="packet-card">
              <div className="packet-card__top">
                <span className="tag">{formatExam(code)}</span>
                <span className="tag">{questions.length} soal</span>
              </div>
              <h3>{formatExam(code)} · {candidate}</h3>
              <p>vocab {sections.vocab} · grammar {sections.grammar} · reading {sections.reading} · listening {sections.listening}</p>
              <div className="packet-card__actions">
                <Link href={`/exam/${candidate.toLowerCase()}/${code}?mode=exam`} className="button-primary button-small">Mode ujian</Link>
                <Link href={`/exam/${candidate.toLowerCase()}/${code}?mode=practice`} className="button-secondary button-small">Latihan</Link>
              </div>
            </motion.article>
          );
        })}
      </motion.section>
    </main>
  );
}
