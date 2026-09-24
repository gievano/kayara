#!/usr/bin/env node
// Rebuild ONLY the listening section 1:1 from ten-jlpt-site.vercel.app.
// Existing vocab/reading stay; listening is replaced per exam, and any
// listening question not present on Ten is dropped.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(__dirname, "../data/questions.json");

const LEVELS = { N5: 2, N4: 10, N3: 29, N2: 30, N1: 30 };

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchExamList(level) {
  const html = await fetch(`https://ten-jlpt-site.vercel.app/${level}`).then((r) => r.text());
  const re = new RegExp(`href="/${level}/([^"/]+)"`, "g");
  const codes = new Set();
  for (const m of html.matchAll(re)) {
    const code = m[1].split("?")[0].split("#")[0];
    if (code && code !== level && !code.includes(".")) codes.add(code);
  }
  return [...codes];
}

async function fetchExam(level, examCode) {
  const url = `https://ten-jlpt-site.vercel.app/${level}/${examCode}`;
  const html = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return r.text();
  });
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,(".*?")\]\)/gs)];
  const allSections = [];
  for (const p of pushes) {
    try {
      const s = JSON.parse(p[1]);
      if (!s.includes('"sections"') || !s.includes('"questionCount"')) continue;
      let idx = 0;
      while ((idx = s.indexOf('"sections":', idx)) !== -1) {
        let start = s.indexOf("[", idx);
        if (start === -1) break;
        let depth = 0, end = start, inStr = false, esc = false;
        for (let i = start; i < s.length; i++) {
          const ch = s[i];
          if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; }
          else { if (ch === '"') inStr = true; else if (ch === "[") depth++; else if (ch === "]") { depth--; if (depth === 0) { end = i; break; } } }
        }
        if (depth !== 0) break;
        const arrStr = s.slice(start, end + 1);
        try {
          const arr = JSON.parse(arrStr);
          if (Array.isArray(arr)) for (const sec of arr) if (sec.questionCount) allSections.push(sec);
        } catch {}
        idx = end + 1;
      }
    } catch {}
  }
  if (allSections.length === 0) throw new Error(`sections not found ${level}/${examCode}`);
  return allSections;
}

function cleanText(html) {
  if (!html) return "";
  if (typeof html !== "string") html = String(html);
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function mediaList(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function mediaHost(item) {
  return item?.hostUrl || item?.url || item?.assetKey || null;
}

function imageMap(q, secOrMedia) {
  const map = new Map();
  const media = secOrMedia?.media ?? secOrMedia;
  for (const item of [...mediaList(q?.media?.images), ...mediaList(media?.images)]) {
    const url = mediaHost(item);
    if (!url) continue;
    if (item.sourcePath) map.set(item.sourcePath, url);
    if (item.assetKey) map.set(item.assetKey, url);
    if (item.hostUrl) map.set(item.hostUrl, url);
  }
  return map;
}

function rewriteImageSources(html, map) {
  return String(html || "").replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["'])(.*?)\2/gi, (all, prefix, quote, src) => {
    const mapped = map.get(src) || (/^https?:\/\//i.test(src) ? src : null);
    return mapped ? `${prefix}${quote}${mapped}${quote}` : all;
  });
}

function questionImage(q, secOrMedia) {
  const media = secOrMedia?.media ?? secOrMedia;
  const own = mediaList(q?.media?.images);
  const ownImage = own.find((item) => mediaHost(item));
  if (ownImage) return mediaHost(ownImage);
  const refs = [...`${q?.prompt?.html || ""}\n${q?.context?.html || ""}`.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const item = mediaList(media?.images).find((candidate) => refs.includes(candidate?.sourcePath) || refs.includes(candidate?.assetKey) || refs.includes(candidate?.hostUrl));
  return item ? mediaHost(item) : null;
}

function sectionAudio(secOrMedia) {
  const media = secOrMedia?.media ?? secOrMedia;
  const list = mediaList(media?.audio);
  return list.length === 1 ? mediaHost(list[0]) : null;
}

function toListening(level, examCode, sec, q, secMedia) {
  let year;
  if (/^\d{2}_\d{4}$/.test(examCode)) year = parseInt(examCode.split("_")[1], 10);
  else if (examCode.startsWith("test_")) { const num = parseInt(examCode.split("_")[1], 10); year = 2019 + (num - 1); }
  else year = 2019;
  const id = `${level.toLowerCase()}-${examCode}-listening-${String(q.order).padStart(2, "0")}`;
  const rawHtml = q.prompt?.html || q.prompt?.text || q.context?.html || "";
  const imageUrls = imageMap(q, sec);
  const question = cleanText(rewriteImageSources(rawHtml, imageUrls)) || cleanText(q.context || q.instruction || "");
  const questionHtml = rawHtml && rawHtml.includes("<") ? rewriteImageSources(rawHtml, imageUrls) : null;
  const options = q.options.map((o) => cleanText(o.html || o.text));
  const answer = q.correctOption == null ? null : Math.max(0, q.correctOption - 1);
  const explanation = q.explanation ? cleanText(q.explanation) : "";
  const out = {
    id, exam: "JLPT", level, year, section: "listening",
    question: question || `(listening) Q${q.order}`,
    options,
    answer,
    explanation: explanation || (answer == null ? `Kunci tidak tersedia. Sumber ten-site ${level}/${examCode} listening` : `Kunci: ${answer + 1}. Sumber ten-site ${level}/${examCode} listening`),
    sourceNote: `ten-site ${level}/${examCode} listening Q${q.order} (listening)`,
    examCode,
  };
  if (questionHtml) out.questionHtml = questionHtml;
  if (questionHtml && imageUrls.size) out.questionHtml = rewriteImageSources(questionHtml, imageUrls);
  const image = questionImage(q, secMedia);
  if (image) out.image = image;
  const qAudio = mediaList(q.media?.audio)[0];
  const secAudio = sectionAudio(secMedia);
  const audio = mediaHost(qAudio) || secAudio;
  if (audio) out.audio = audio;
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const levelArg = args.find((a) => a.startsWith("--level="))?.split("=")[1]?.toUpperCase();
  const examArg = args.find((a) => a.startsWith("--exam="))?.split("=")[1];
  const levels = levelArg ? [levelArg] : Object.keys(LEVELS);

  const fresh = [];
  for (const level of levels) {
    let exams;
    if (examArg) exams = [examArg];
    else {
      try {
        const list = await fetchExamList(level);
        exams = list.length ? list : Array.from({ length: LEVELS[level] }, (_, i) => `test_${i + 1}`);
        console.log(`discovered ${level}: ${exams.join(", ")}`);
      } catch (e) {
        console.error(`  list fail ${level}`, e.message);
        exams = Array.from({ length: LEVELS[level] }, (_, i) => `test_${i + 1}`);
      }
    }
    for (const examCode of exams) {
      try {
        const sections = await fetchExam(level, examCode);
        const sec = sections.find((s) => s.section === "listening");
        if (!sec) { console.log(`fetch ${level}/${examCode}: no listening section`); continue; }
        const qs = (sec.questions || []).map((q) => toListening(level, examCode, sec, q, sec.media));
        fresh.push(...qs);
        console.log(`  ${level}/${examCode}: listening ${qs.length}, audio ${qs.filter((z) => z.audio).length}`);
      } catch (e) {
        console.error(`  fail ${level}/${examCode}:`, e.message);
      }
      await sleep(400);
    }
  }

  console.log(`\nfresh listening fetched: ${fresh.length}`);
  const seen = new Set(); const freshDedup = [];
  for (const q of fresh) if (!seen.has(q.id)) { seen.add(q.id); freshDedup.push(q); }
  const byLevel = {};
  for (const q of freshDedup) byLevel[q.level] = (byLevel[q.level] || 0) + 1;
  console.log(byLevel);
  console.log("without audio:", freshDedup.filter((q) => !q.audio).length);

  if (dry) { console.log("\n--dry, sample:"); console.log(JSON.stringify(freshDedup.slice(0, 2), null, 2)); return; }

  const existing = JSON.parse(fs.readFileSync(qPath, "utf8"));
  const freshIds = new Set(freshDedup.map((q) => q.id));
  // keep non-listening + fresh listening; drop stale listening ids
  const out = existing.filter((q) => q.section !== "listening" || freshIds.has(q.id));
  const outIds = new Set(out.map((q) => q.id));
  for (const q of freshDedup) if (!outIds.has(q.id)) out.push(q);
  const order = { vocab: 0, grammar: 1, reading: 2, listening: 3 };
  out.sort((a, b) => a.level.localeCompare(b.level) || (a.examCode || "").localeCompare(b.examCode || "") || (order[a.section] ?? 9) - (order[b.section] ?? 9) || a.id.localeCompare(b.id));
  fs.writeFileSync(qPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`wrote ${out.length} questions to ${qPath} (listening → ${freshDedup.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });