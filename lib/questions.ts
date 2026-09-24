import metadata from "@/lib/metadata.json";

export type Section = "vocab" | "grammar" | "reading" | "listening";
export type Question = {
  id: string;
  exam: "JLPT";
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  year: number;
  examCode?: string;
  section: Section;
  question: string;
  questionHtml?: string;
  options: string[];
  answer: number | null;
  explanation: string;
  sourceNote?: string;
  image?: string;
  audio?: string;
  passageHtml?: string;
};

export const YEARS = [2019, 2020, 2021, 2022, 2023] as const;
export type YearFilter = number | "all";
export type ExamFilter = string | "all";

const meta = metadata as Record<string, { exams: string[]; total: number; sections: Record<Section, number>; examsDetail: Record<string, { count: number; sections: Record<Section, number> }> }>;

export function getAvailableExams(level: string = "N5"): string[] {
  return meta[level]?.exams ?? [];
}

export function getLevelMeta(level: string) {
  const l = meta[level];
  return l ? { total: l.total, sections: l.sections, examCount: l.exams.length } : null;
}

export function countBySectionForExam(level: string, examCode: string): Record<Section, number> {
  return meta[level]?.examsDetail[examCode]?.sections ?? { vocab: 0, grammar: 0, reading: 0, listening: 0 };
}