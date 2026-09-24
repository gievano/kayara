#!/usr/bin/env node
// Verify v2: audio ten dihitung dari section media (file per part) + per-question.
// Passage: hitung soal reading yang ten punya context (html/text) vs kayara punya passageHtml.
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LEVELS = { N5: 2, N4: 10, N3: 29, N2: 30, N1: 30 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "public", "questions.json.gz"))).toString("utf8"));
const byExam = {};
for (const q of data) {
  const k = `${q.level}/${q.examCode}`;
  if (!byExam[k]) byExam[k] = { vocab: 0, reading: 0, listening: 0, passage: 0, audio: 0 };
  const e = byExam[k];
  e[q.section]++;
  if (q.section === "reading" && q.passageHtml) e.passage++;
  if (q.section === "listening" && q.audio) e.audio++;
}

async function fetchTenSections(level, examCode) {
  const html = await fetch(`https://ten-jlpt-site.vercel.app/${level}/${examCode}`, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => (r.ok ? r.text() : null));
  if (!html) return null;
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,(".*?")\]\)/gs)];
  let payload = null;
  for (const p of pushes) { try { const s = JSON.parse(p[1]); if (s.includes('"sections"')) payload = s; } catch {} }
  if (!payload) return null;
  const idx = payload.indexOf('"sections":');
  const start = payload.indexOf("[", idx);
  let depth = 0, end = start, inStr = false, esc = false;
  for (let i = start; i < payload.length; i++) {
    const ch = payload[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; }
    else { if (ch === '"') inStr = true; else if (ch === "[") depth++; else if (ch === "]") { depth--; if (depth === 0) { end = i; break; } } }
  }
  if (depth !== 0) return null;
  return JSON.parse(payload.slice(start, end + 1));
}

function audioOf(q, sec) {
  const qa = q.media?.audio?.hostUrl || (Array.isArray(q.media?.audio) ? q.media.audio[0]?.hostUrl : null);
  if (qa) return qa;
  const list = Array.isArray(sec?.media?.audio)
    ? sec.media.audio
    : sec?.media?.audio ? [sec.media.audio] : [];
  return list.length === 1 ? list[0]?.hostUrl || null : null;
}

function summarizeTen(sections) {
  const out = { vocab: 0, reading: 0, listening: 0, readingContext: 0, listeningAudio: 0 };
  for (const sec of sections) {
    const qs = sec.questions || [];
    if (!qs.length) continue;
    out[sec.section] += qs.length;
    if (sec.section === "reading") out.readingContext += qs.filter((q) => {
      const c = q.context;
      if (!c) return false;
      if (typeof c === "string") return c.replace(/<[^>]*>/g, "").trim().length > 0;
      const text = (c.text || "").trim();
      const html = c.html || "";
      // Keep visual-only reading contexts (images/tables) meaningful, but
      // ignore Ten's whitespace-only closing-div placeholder. A non-empty
      // `text` is authoritative even when Ten's html field is malformed.
      return Boolean(text || /<(?:img|table|svg|iframe|canvas)\b/i.test(html) || html.replace(/<[^>]*>/g, "").trim());
    }).length;
    if (sec.section === "listening") {
      for (const q of qs) if (audioOf(q, sec)) out.listeningAudio++;
    }
  }
  return out;
}

let problems = [], ok = 0;
for (const level of Object.keys(LEVELS)) {
  const exams = [...new Set(data.filter((q) => q.level === level).map((q) => q.examCode))].sort();
  for (const code of exams) {
    const key = `${level}/${code}`;
    const k = byExam[key];
    const ten = await fetchTenSections(level, code);
    if (!ten) { problems.push(`${key}: ten page GAGAL`); continue; }
    const t = summarizeTen(ten);
    const issues = [];
    if (t.vocab !== k.vocab) issues.push(`vocab ten=${t.vocab} kayara=${k.vocab}`);
    if (t.reading !== k.reading) issues.push(`reading ten=${t.reading} kayara=${k.reading}`);
    if (t.listening !== k.listening) issues.push(`listening ten=${t.listening} kayara=${k.listening}`);
    if (t.readingContext !== k.passage) issues.push(`passage ten=${t.readingContext} kayara=${k.passage}`);
    if (t.listeningAudio !== k.audio) issues.push(`audio ten=${t.listeningAudio} kayara=${k.audio}`);
    if (issues.length) problems.push(`${key}: ${issues.join(" | ")}`);
    else ok++;
    await sleep(100);
  }
  console.log(`${level} done (${ok} OK sejauh ini)`);
}
console.log(`\n✅ MATCH: ${ok}/101`);
console.log(`❌ PROBLEMS: ${problems.length}`);
problems.forEach((p) => console.log("  ", p));