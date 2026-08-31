import Link from "next/link";
import { getAvailableExams } from "@/lib/questions";
import { getQuestionsByExam } from "@/lib/questions-server";
import ExamClient from "./exam-client";

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
  if (code === "all") return "Campuran";
  return code;
}

export default async function ExamYearPage({ params, searchParams }: { params: Promise<{ level: string; year: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { level, year } = await params;
  const query = await searchParams;
  const mode = query.mode === "practice" ? "practice" : "exam";
  const candidate = level.toUpperCase();

  if (!isLevel(candidate)) {
    return (
      <main className="page-frame page-main">
        <div className="empty-state">
          <h1>Level tidak ditemukan</h1>
          <p>{candidate} belum tersedia.</p>
          <Link href="/exam/n5" className="button-primary">Pilih N5</Link>
        </div>
      </main>
    );
  }

  const exams = getAvailableExams(candidate);
  const exists = year === "all" || exams.includes(year);

  if (!exists) {
    return (
      <main className="page-frame page-main">
        <div className="empty-state">
          <h1>Paket tidak ditemukan</h1>
          <p>Paket {candidate} / {year} belum tersedia.</p>
          <Link href={`/exam/${candidate.toLowerCase()}`} className="button-primary">Pilih paket lain</Link>
        </div>
      </main>
    );
  }

  const questions = getQuestionsByExam(year, candidate);
  if (questions.length === 0) {
    return (
      <main className="page-frame page-main">
        <div className="empty-state">
          <h1>Paket masih kosong</h1>
          <p>Belum ada soal untuk paket ini.</p>
          <Link href={`/exam/${candidate.toLowerCase()}`} className="button-primary">Pilih paket lain</Link>
        </div>
      </main>
    );
  }

  const label = year === "all" ? `Campuran ${candidate} (${questions.length} soal)` : `${formatExam(year)} · ${candidate} (${questions.length} soal)`;
  return <ExamClient level={candidate} yearLabel={label} questions={questions} storageKey={`kayara:${candidate}:${year}:${mode}`} mode={mode} />;
}
