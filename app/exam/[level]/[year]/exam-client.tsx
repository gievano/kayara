"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Question, Section } from "@/lib/questions";
import { calcScore } from "@/lib/score";

const SECTIONS: Section[] = ["vocab", "grammar", "reading", "listening"];
const LABELS: Record<Section, string> = { vocab: "文字・語彙", grammar: "文法", reading: "読解", listening: "聴解" };
const MINUTES: Record<string, number> = { N5: 90, N4: 115, N3: 140, N2: 155, N1: 165 };

function Arrow({ left = false }: { left?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={left ? { transform: "rotate(180deg)" } : undefined}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function Clock() {
  return <svg className="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function Play({ stop }: { stop: boolean }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{stop ? <path d="M7 7h10v10H7z" /> : <path d="m8 5 11 7-11 7V5z" />}</svg>;
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function sectionName(section: Section, level: string) {
  if (section === "vocab") return level === "N5" || level === "N4" ? "Vocabulary" : "Vocabulary & Grammar";
  if (section === "reading") return level === "N5" || level === "N4" ? "Grammar & Reading" : "Reading";
  if (section === "grammar") return "Grammar";
  return "Listening";
}

export default function ExamClient({ level, yearLabel, questions, storageKey, mode }: { level: string; yearLabel: string; questions: Question[]; storageKey: string; mode: "exam" | "practice" }) {
  const reduced = Boolean(useReducedMotion());
  const total = questions.length;
  const isExam = mode === "exam";
  const initialTime = (MINUTES[level] ?? 90) * 60;
  const ranges = useMemo(() => {
    const map = new Map<Section, { start: number; count: number }>();
    questions.forEach((question, index) => {
      const range = map.get(question.section) ?? { start: index, count: 0 };
      range.count += 1;
      map.set(question.section, range);
    });
    return map;
  }, [questions]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [secondsLeft, setSecondsLeft] = useState(initialTime);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timerOff, setTimerOff] = useState(!isExam);
  const [revealed, setRevealed] = useState<boolean[]>(() => Array(total).fill(false));
  const [showAnswers, setShowAnswers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listeningUnlocked, setListeningUnlocked] = useState(!isExam);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const question = questions[index] ?? questions[0];
  const answered = answers.filter((answer) => answer !== null).length;
  const progress = total ? answered / total * 100 : 0;
  const result = useMemo(() => submitted ? calcScore(questions, answers) : null, [submitted, questions, answers]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return;
        const saved: unknown = JSON.parse(raw);
        if (!saved || typeof saved !== "object") return;
        const data = saved as Record<string, unknown>;
        if (Array.isArray(data.answers) && data.answers.length === total) setAnswers(data.answers as (number | null)[]);
        const savedIndex = typeof data.index === "number" ? data.index : data.idx;
        const savedSeconds = typeof data.secondsLeft === "number" ? data.secondsLeft : data.secLeft;
        if (typeof savedIndex === "number") setIndex(Math.min(Math.max(savedIndex, 0), total - 1));
        if (typeof savedSeconds === "number" && isExam) setSecondsLeft(savedSeconds);
        if (data.submitted === true) setSubmitted(true);
        if (Array.isArray(data.revealed) && !isExam) setRevealed(data.revealed as boolean[]);
      } catch (error) {
        console.warn("Progres ujian tidak dapat dipulihkan.", error);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [storageKey, total, isExam]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ answers, idx: index, secLeft: secondsLeft, submitted, revealed }));
    } catch (error) {
      console.warn("Progres ujian tidak dapat disimpan.", error);
    }
  }, [answers, index, secondsLeft, submitted, revealed, storageKey]);

  useEffect(() => {
    if (submitted || timerOff) return;
    const timer = window.setInterval(() => setSecondsLeft((seconds) => {
      if (seconds <= 1) {
        if (isExam) setSubmitted(true);
        return 0;
      }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [submitted, timerOff, isExam]);

  useEffect(() => {
    if (!confirming) return;
    const trigger = triggerRef.current;
    cancelRef.current?.focus();
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setConfirming(false);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      trigger?.focus();
    };
  }, [confirming]);

  function play() {
    if (question.audio) {
      const audio = document.getElementById(`audio-${question.id}`) as HTMLAudioElement | null;
      if (!audio) return;
      if (audio.paused) void audio.play(); else audio.pause();
      return;
    }
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.question);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function nextSection() {
    const current = SECTIONS.indexOf(question.section);
    if (current === SECTIONS.length - 1) return setConfirming(true);
    const next = SECTIONS[current + 1];
    if (next === "listening") setListeningUnlocked(true);
    const range = ranges.get(next);
    if (range) setIndex(range.start);
  }

  function restart() {
    setAnswers(Array(total).fill(null));
    setIndex(0);
    setSecondsLeft(initialTime);
    setSubmitted(false);
    setRevealed(Array(total).fill(false));
    sessionStorage.removeItem(storageKey);
  }

  if (submitted && result) {
    return <main className="page-frame page-main">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={`/exam/${level.toLowerCase()}`}>Pilih paket</Link><span>/</span><span>Hasil {level}</span></nav>
      <motion.section initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="result-hero">
        <div><h1>Hasil latihanmu</h1><p className="result-summary">{level} · {yearLabel}<br />{result.correct} dari {result.total} benar. {answered} soal dijawab.</p></div>
        <div className="result-score" aria-label={`Skor ${result.score}`}>{result.score}</div>
      </motion.section>
      <section className="result-sections" aria-label="Skor per bagian">
        {SECTIONS.map((section) => <div className="result-section" key={section}><span>{LABELS[section]}</span><strong>{result.perSection[section].correct}/{result.perSection[section].total}</strong><span>{result.perSection[section].total ? Math.round(result.perSection[section].correct / result.perSection[section].total * 100) : 0}% benar</span></div>)}
      </section>
      <div className="result-actions"><button onClick={restart} className="button-primary">Ulangi paket</button><Link href={`/exam/${level.toLowerCase()}`} className="button-secondary">Pilih paket lain</Link><Link href="/" className="button-quiet">Beranda</Link></div>
      <motion.section className="result-review-list" initial={reduced ? false : "hidden"} animate="visible" variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.025 } } }}>
        {result.details.map(({ question: item, picked, isCorrect }, itemIndex) => <motion.article key={item.id} variants={reduced ? {} : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="result-review" data-correct={isCorrect}>
          <div className="question-meta"><span className="tag">{isCorrect ? "Benar" : "Belum dijawab"}</span><span className="tag">Soal {itemIndex + 1}</span><span className="tag">{LABELS[item.section]}</span></div>
          {item.questionHtml ? <p className="question-text" dangerouslySetInnerHTML={{ __html: item.questionHtml }} /> : <p className="question-text">{item.question}</p>}
          {item.image && <img src={item.image} alt={`Ilustrasi soal ${itemIndex + 1}`} loading="lazy" />}
          {item.audio && <audio controls preload="none" src={item.audio} className="w-full" />}
          {item.options.map((option, optionIndex) => <div key={optionIndex} className="review-answer" data-answer={item.answer === optionIndex} data-picked-wrong={picked === optionIndex && !isCorrect}><span>{optionIndex + 1}. {option}</span><span>{item.answer === optionIndex ? "Jawaban benar" : picked === optionIndex ? "Jawabanmu" : ""}</span></div>)}
          {!isCorrect && <div className="explanation"><strong>Kunci jawaban:</strong> {item.options[item.answer]}</div>}
        </motion.article>)}
      </motion.section>
    </main>;
  }

  const listening = question.section === "listening";
  const answerVisible = !isExam && (revealed[index] || showAnswers);

  return <main className="exam-shell">
    <div className="exam-progress" aria-label={`${Math.round(progress)} persen dijawab`}><motion.div className="exam-progress__bar" animate={{ width: `${progress}%` }} /></div>
    <div className="exam-toolbar">
      <div className="exam-toolbar__identity"><Link href={`/exam/${level.toLowerCase()}`} className="button-quiet button-small">Paket</Link><span className="exam-toolbar__title">{level} · {yearLabel}</span><span className={`mode-tag ${isExam ? "mode-tag--exam" : "mode-tag--practice"}`}>{isExam ? "Ujian" : "Latihan"}</span><span className="question-count">{answered}/{total} dijawab</span></div>
      <div className="exam-toolbar__actions">
        {!isExam && <><button onClick={() => setShowAnswers((value) => !value)} aria-pressed={showAnswers} className="button-quiet button-small">{showAnswers ? "Sembunyikan kunci" : "Lihat semua kunci"}</button><button onClick={() => setTimerOff((value) => !value)} className="button-quiet button-small">Timer {timerOff ? "mati" : "aktif"}</button></>}
        <div className={`timer ${!timerOff && secondsLeft < 60 ? "timer--urgent" : ""}`} aria-live="polite"><Clock />{timerOff ? "Mati" : formatTime(secondsLeft)}</div>
        <button ref={triggerRef} onClick={() => setConfirming(true)} className="button-danger button-small">Selesaikan</button>
      </div>
    </div>
    <nav className="section-tabs" aria-label="Bagian ujian">
      {SECTIONS.map((section) => {
        const range = ranges.get(section);
        if (!range) return null;
        const locked = isExam && section === "listening" && !listeningUnlocked;
        return <button key={section} className="section-tab" aria-current={question.section === section ? "true" : undefined} disabled={locked} onClick={() => setIndex(range.start)}>{sectionName(section, level)} · {range.count}</button>;
      })}
      {isExam && !listeningUnlocked && ranges.has("listening") && <button onClick={() => setListeningUnlocked(true)} className="button-secondary button-small">Buka Listening</button>}
    </nav>
    <div className="exam-layout">
      <aside className="question-nav">
        <div className="question-nav__header"><span>{LABELS[question.section]}</span><span>{index + 1}/{total}</span></div>
        <div className="question-nav__grid">{questions.map((item, itemIndex) => <button key={item.id} onClick={() => setIndex(itemIndex)} className="question-nav__item" data-answered={answers[itemIndex] !== null} aria-current={itemIndex === index ? "true" : undefined} aria-label={`Soal ${itemIndex + 1}, ${answers[itemIndex] === null ? "belum dijawab" : "sudah dijawab"}`}>{itemIndex + 1}</button>)}</div>
        <p className="question-nav__note">Jawaban tersimpan otomatis selama sesi. {Math.round(progress)}% soal telah dijawab.</p>
        {isExam && <button onClick={nextSection} className="button-secondary button-small">Bagian berikutnya</button>}
      </aside>
      <AnimatePresence mode="wait">
        <motion.section key={index} initial={reduced ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -10 }} transition={{ duration: 0.24 }} className="question-panel">
          <div className="question-panel__head"><div className="question-meta"><span className="question-number">Soal {index + 1}</span><span className="tag">{LABELS[question.section]}</span><span className="tag">{question.year}</span>{answerVisible && <span className="tag">Kunci terlihat</span>}</div></div>
          {listening && <div className="media-panel"><div className="media-panel__row"><button onClick={play} className="icon-button" aria-label={isSpeaking ? "Hentikan audio" : "Putar audio"}><Play stop={isSpeaking} /></button><div><strong>Choukai — dengarkan audio</strong><p>{question.audio ? "Audio tersedia untuk soal ini." : "Menggunakan pembaca suara bahasa Jepang."}</p></div></div>{question.audio && <audio id={`audio-${question.id}`} controls preload="none" src={question.audio} className="w-full" />}</div>}
          {listening && question.question.trim() === "1番" ? <h1 className="question-text">Dengarkan audio, lalu pilih jawaban yang paling tepat.</h1> : question.questionHtml ? <h1 className="question-text" dangerouslySetInnerHTML={{ __html: question.questionHtml }} /> : <h1 className="question-text">{question.question}</h1>}
          {question.image && !listening && <img src={question.image} alt={`Ilustrasi soal ${index + 1}`} loading="lazy" />}
          <div className="answer-list" role="radiogroup" aria-label={`Pilihan soal ${index + 1}`}>{question.options.map((option, optionIndex) => <motion.button whileTap={reduced ? undefined : { y: 1 }} key={optionIndex} role="radio" aria-checked={answers[index] === optionIndex} data-correct={answerVisible && question.answer === optionIndex} onClick={() => setAnswers((previous) => { const next = [...previous]; next[index] = optionIndex; return next; })} className="answer-option"><span className="answer-option__number">{optionIndex + 1}</span><span>{option}</span>{answerVisible && question.answer === optionIndex && <strong className="ml-auto">Jawaban benar</strong>}</motion.button>)}</div>
          {!isExam && <button onClick={() => setRevealed((previous) => { const next = [...previous]; next[index] = !next[index]; return next; })} className="button-quiet button-small">{revealed[index] ? "Sembunyikan kunci" : "Lihat kunci"}</button>}
          {answerVisible && <div className="explanation"><strong>Kunci jawaban:</strong> {question.options[question.answer]}</div>}
          <div className="question-actions"><button onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="button-secondary"><span className="icon-inline"><Arrow left /></span>Sebelumnya</button><span>{index + 1} / {total}</span>{index < total - 1 ? <button onClick={() => setIndex((value) => Math.min(total - 1, value + 1))} className="button-primary question-actions__next">Berikutnya <span className="icon-inline"><Arrow /></span></button> : <button onClick={() => setConfirming(true)} className="button-danger question-actions__next">Selesaikan</button>}</div>
        </motion.section>
      </AnimatePresence>
    </div>
    <AnimatePresence>{confirming && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dialog-backdrop" onMouseDown={() => setConfirming(false)}><motion.div initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="dialog" onMouseDown={(event) => event.stopPropagation()}><h2 id="confirm-title">Selesaikan ujian?</h2><p>Kamu menjawab {answered} dari {total} soal. Soal kosong akan dihitung salah. Sisa waktu {timerOff ? "dimatikan" : formatTime(secondsLeft)}.</p><div className="dialog__actions"><button ref={cancelRef} onClick={() => setConfirming(false)} className="button-secondary">Lanjut mengerjakan</button><button onClick={() => { setSubmitted(true); setConfirming(false); }} className="button-danger">Lihat hasil</button></div></motion.div></motion.div>}</AnimatePresence>
  </main>;
}
