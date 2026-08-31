import type { Question, ExamFilter, YearFilter } from "@/lib/questions";

// ponytail: server-only — reads public/questions.json.gz via fs+zlib
let _cached: Question[] | null = null;
export function loadQuestions(): Question[] {
  if (_cached) return _cached;
  const fs = require("fs") as typeof import("fs");
  const zlib = require("zlib") as typeof import("zlib");
  const path = require("path") as typeof import("path");
  const buf = fs.readFileSync(path.join(process.cwd(), "public", "questions.json.gz"));
  _cached = JSON.parse(zlib.gunzipSync(buf).toString("utf-8")) as Question[];
  return _cached;
}

export function getQuestionsByExam(examCode: ExamFilter, level: string = "N5"): Question[] {
  const all = loadQuestions();
  if (examCode === "all") return all.filter((q) => q.level === level);
  return all.filter((q) => q.level === level && (q.examCode === examCode || String(q.year) === examCode));
}

export function getQuestions(year: YearFilter, level: string = "N5"): Question[] {
  const all = loadQuestions();
  if (year === "all") return all.filter((q) => q.level === level);
  return all.filter((q) => q.level === level && q.year === year);
}