import raw from "@/data/questions.json";

export type Section = "vocab" | "grammar" | "reading" | "listening";
export type Question = {
  id: string;
  exam: "JLPT";
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  year: number;
  examCode?: string;
  section: Section;
  question: string;
  questionHtml?: string; // ponytail: ten-site underline <u>
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  sourceNote?: string;
  image?: string;
  audio?: string;
  passageHtml?: string; // scraped from Ten site
};

const questions = raw as Question[];

export const YEARS = [2019, 2020, 2021, 2022, 2023] as const;
export type YearFilter = number | "all";
export type ExamFilter = string | "all";

export function getQuestions(year: YearFilter, level: string = "N5"): Question[] {
  if (year === "all") return questions.filter((q) => q.level === level);
  return questions.filter((q) => q.level === level && q.year === year);
}

// ten-site: examCode based
export function getQuestionsByExam(examCode: ExamFilter, level: string = "N5"): Question[] {
  if (examCode === "all") return questions.filter((q) => q.level === level);
  return questions.filter((q) => q.level === level && (q.examCode === examCode || String(q.year) === examCode));
}

export function getAvailableYears(level: string = "N5"): number[] {
  const s = new Set(questions.filter((q) => q.level === level).map((q) => q.year));
  return [...s].sort((a, b) => b - a);
}

export function getAvailableExams(level: string = "N5"): string[] {
  const hasExamCode = questions.some((q) => q.level === level && q.examCode);
  if (hasExamCode) {
    const s = new Set(questions.filter((q) => q.level === level).map((q) => q.examCode || String(q.year)));
    const arr = [...s];
    arr.sort((a, b) => {
      const da = a.match(/^(\d{2})_(\d{4})$/);
      const db = b.match(/^(\d{2})_(\d{4})$/);
      if (da && db) {
        const ya = parseInt(da[2], 10), yb = parseInt(db[2], 10);
        if (ya !== yb) return yb - ya;
        return parseInt(db[1], 10) - parseInt(da[1], 10);
      }
      if (da && !db) return -1;
      if (!da && db) return 1;
      // test_1 etc: sort by number
      const na = parseInt(a.split("_")[1] || "0", 10);
      const nb = parseInt(b.split("_")[1] || "0", 10);
      if (!isNaN(na) && !isNaN(nb) && a.startsWith("test_") && b.startsWith("test_")) return na - nb;
      return a.localeCompare(b);
    });
    return arr;
  }
  return getAvailableYears(level).map(String);
}

export function countByYear(level: string = "N5"): Record<number, number> {
  const m: Record<number, number> = {};
  for (const q of questions.filter((q) => q.level === level)) {
    m[q.year] = (m[q.year] ?? 0) + 1;
  }
  return m;
}

export function countByExam(level: string = "N5"): Record<string, number> {
  const m: Record<string, number> = {};
  for (const q of questions.filter((q) => q.level === level)) {
    const k = q.examCode || String(q.year);
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

export function countBySection(qs: Question[]): Record<Section, number> {
  const m: Record<Section, number> = { vocab: 0, grammar: 0, reading: 0, listening: 0 };
  for (const q of qs) m[q.section]++;
  return m;
}
