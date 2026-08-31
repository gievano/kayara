#!/usr/bin/env node
// Rebuild public/questions.json.gz + lib/metadata.json from data/questions.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const questions = JSON.parse(fs.readFileSync(path.join(root, "data", "questions.json"), "utf8"));

const SECTIONS = ["vocab", "grammar", "reading", "listening"];
const order = { vocab: 0, grammar: 1, reading: 2, listening: 3 };
const byLevel = {};
for (const q of questions) (byLevel[q.level] ??= []).push(q);

const meta = {};
for (const [level, qs] of Object.entries(byLevel)) {
  const exams = {};
  for (const q of qs) {
    const code = q.examCode || String(q.year);
    exams[code] ??= { count: 0, sections: { vocab: 0, grammar: 0, reading: 0, listening: 0 } };
    exams[code].count++;
    if (SECTIONS.includes(q.section)) exams[code].sections[q.section]++;
  }
  const sections = { vocab: 0, grammar: 0, reading: 0, listening: 0 };
  for (const q of qs) if (SECTIONS.includes(q.section)) sections[q.section]++;
  meta[level] = {
    exams: Object.keys(exams).sort((a, b) => orderCompare(a, b)),
    total: qs.length,
    sections,
    examsDetail: exams,
  };
}
function orderCompare(a, b) {
  // keep tests (test_1) first-like existing? just natural sort for determinism
  return a.localeCompare(b, "en", { numeric: true });
}

const raw = JSON.stringify(questions);
const gz = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
fs.writeFileSync(path.join(root, "public", "questions.json.gz"), gz);
fs.writeFileSync(path.join(root, "lib", "metadata.json"), JSON.stringify(meta));

console.log(`questions: ${questions.length}`);
console.log(`gz: ${(gz.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`levels:`, Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, v.total])));
console.log("metadata.json:", JSON.stringify(meta, null, 0).length, "bytes");