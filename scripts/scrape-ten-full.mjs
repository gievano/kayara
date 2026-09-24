#!/usr/bin/env node
// Full 1:1 scrape of ten-jlpt-site.vercel.app — all levels, all exams.
// Preserves: vocab prompts (<u>), reading context.html as passageHtml,
// listening per-question media.audio hostUrl + images.
// Output: public/questions.json.gz + lib/metadata.json (same live schema).
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LEVELS = { N5: 2, N4: 10, N3: 29, N2: 30, N1: 30 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function fetchSections(level, examCode) {
  const url = `https://ten-jlpt-site.vercel.app/${level}/${examCode}`;
  const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return r.text();
  });
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,(".*?")\]\)/gs)];
  let payload = null;
  for (const p of pushes) {
    try {
      const s = JSON.parse(p[1]);
      if (s.includes('"sections"')) payload = s;
    } catch {}
  }
  if (!payload) throw new Error(`no sections payload ${level}/${examCode}`);
  const idx = payload.indexOf('"sections":');
  const start = payload.indexOf("[", idx);
  let depth = 0, end = start, inStr = false, esc = false;
  for (let i = start; i < payload.length; i++) {
    const ch = payload[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; }
    else { if (ch === '"') inStr = true; else if (ch === "[") depth++; else if (ch === "]") { depth--; if (depth === 0) { end = i; break; } } }
  }
  if (depth !== 0) throw new Error(`unbalanced sections ${level}/${examCode}`);
  return JSON.parse(payload.slice(start, end + 1));
}

function cleanText(html) {
  if (!html) return "";
  if (typeof html !== "string") html = String(html);
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

// strip trailing div junk inside context.html of ten
function cleanPassage(html) {
  if (!html) return null;
  let s = html.replace(/\s*<\/div>\s*$/g, "").trim();
  s = s.replace(/<br\s*\/?>\s*(<br\s*\/?>)+/gi, "<br/><br/>").trim();
  return s || null;
}

function toQuestion(level, examCode, sec, q) {
  let year;
  if (/^\d{2}_\d{4}$/.test(examCode)) year = parseInt(examCode.split("_")[1], 10);
  else year = 2019;
  const secName = ["vocab", "grammar", "reading", "listening"].includes(sec.section) ? sec.section : "reading";
  const id = `${level.toLowerCase()}-${examCode}-${secName}-${String(q.order).padStart(2, "0")}`;
  const rawHtml = q.prompt?.html || q.prompt?.text || "";
  const question = cleanText(rawHtml) || cleanText(q.context?.text || q.instruction || "");
  const questionHtml = rawHtml && rawHtml.includes("<") ? rawHtml : null;
  const options = (q.options || []).map((o) => cleanText(o.html || o.text));
  while (options.length < 4) options.push("");
  const answer = Math.max(0, (q.correctOption ?? 1) - 1);
  const explanation = q.explanation ? cleanText(q.explanation) : "";
  const out = {
    id, exam: "JLPT", level, year, section: secName,
    question: question || `(${secName}) Q${q.order}`,
    options: options.slice(0, 4), answer,
    explanation: explanation || `Kunci: ${answer + 1}. Sumber ten-site ${level}/${examCode} ${sec.section}`,
    sourceNote: `ten-site ${level}/${examCode} ${sec.section} Q${q.order} (${secName})`,
    examCode,
  };
  if (questionHtml) out.questionHtml = questionHtml;
  const ctx = q.context;
  if (ctx && (ctx.html || ctx.text)) {
    const passage = cleanPassage(ctx.html);
    if (passage) out.passageHtml = passage;
    else out.question = cleanText(ctx.text || ctx.html) || out.question;
  }
  const qImg = q.media?.images?.[0]?.hostUrl || q.media?.images?.[0]?.assetKey;
  const secImg = sec.media?.images?.[q.order - 1]?.hostUrl || sec.media?.images?.[0]?.hostUrl;
  if (qImg) out.image = qImg;
  else if (secImg) out.image = secImg;
  const qAudio = q.media?.audio?.hostUrl || (Array.isArray(q.media?.audio) ? q.media.audio[0]?.hostUrl : null);
  const secAudioList = Array.isArray(sec.media?.audio)
    ? sec.media.audio
    : sec.media?.audio ? [sec.media.audio] : [];
  // Ten uses a single section track for older exams. A multi-track section
  // must not invent a track for a question whose own media is absent.
  const secAudio = secAudioList.length === 1 ? secAudioList[0]?.hostUrl : null;
  if (qAudio) out.audio = qAudio;
  else if (secAudio) out.audio = secAudio;
  return out;
}

async function main() {
  const all = [];
  const fails = [];
  let examsTotal = 0;
  for (const level of Object.keys(LEVELS)) {
    let exams;
    try {
      exams = await fetchExamList(level);
    } catch (e) {
      console.error(`list fail ${level}:`, e.message);
      exams = Array.from({ length: LEVELS[level] }, (_, i) => `test_${i + 1}`);
    }
    if (!exams.length) exams = Array.from({ length: LEVELS[level] }, (_, i) => `test_${i + 1}`);
    console.log(`discovered ${level}: ${exams.length} exams`);
    examsTotal += exams.length;
    for (const examCode of exams) {
      try {
        const sections = await fetchSections(level, examCode);
        for (const sec of sections) {
          for (const q of sec.questions || []) all.push(toQuestion(level, examCode, sec, q));
        }
        const counts = sections.map((s) => `${s.section}:${s.questionCount ?? s.questions?.length ?? 0}`).join(", ");
        console.log(`  ${level}/${examCode} OK [${counts}]`);
      } catch (e) {
        fails.push(`${level}/${examCode}: ${e.message}`);
        console.error(`  FAIL ${level}/${examCode}: ${e.message}`);
      }
      await sleep(500);
    }
  }

  const seen = new Set();
  const out = [];
  for (const q of all) if (!seen.has(q.id)) { seen.add(q.id); out.push(q); }
  const order = { vocab: 0, grammar: 1, reading: 2, listening: 3 };
  out.sort((a, b) => a.level.localeCompare(b.level) || (a.examCode || "").localeCompare(b.examCode || "") || (order[a.section] ?? 9) - (order[b.section] ?? 9) || a.id.localeCompare(b.id));

  console.log(`\nfetched ${out.length} questions (${examsTotal} exams, ${fails.length} fails)`);
  const byLevel = {};
  for (const q of out) byLevel[q.level] = (byLevel[q.level] || 0) + 1;
  console.log("by level:", byLevel);
  const bySec = {};
  for (const q of out) { const k = `${q.level}-${q.section}`; bySec[k] = (bySec[k] || 0) + 1; }
  console.log("by level-section:", bySec);
  console.log("reading with passage:", out.filter((q) => q.section === "reading" && q.passageHtml).length, "/", out.filter((q) => q.section === "reading").length);
  console.log("listening with audio:", out.filter((q) => q.section === "listening" && q.audio).length, "/", out.filter((q) => q.section === "listening").length);
  if (fails.length) { console.log("\nFAILS:"); for (const f of fails) console.log(" ", f); }

  // metadata
  const meta = {};
  for (const level of Object.keys(LEVELS)) {
    const lq = out.filter((q) => q.level === level);
    const examsArr = [...new Set(lq.map((q) => q.examCode))].sort();
    const sections = { vocab: 0, grammar: 0, reading: 0, listening: 0 };
    for (const q of lq) if (sections[q.section] !== undefined) sections[q.section]++;
    const examsDetail = {};
    for (const code of examsArr) {
      const eq = lq.filter((q) => q.examCode === code);
      const s = { vocab: 0, grammar: 0, reading: 0, listening: 0 };
      for (const q of eq) if (s[q.section] !== undefined) s[q.section]++;
      examsDetail[code] = { count: eq.length, sections: s };
    }
    meta[level] = { exams: examsArr, total: lq.length, sections, examsDetail };
  }

  const gzPath = path.join(ROOT, "public", "questions.json.gz");
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(out), "utf8"), { level: 9 });
  fs.writeFileSync(gzPath, gz);
  console.log(`wrote ${gzPath} (${gz.length} bytes)`);
  fs.writeFileSync(path.join(ROOT, "lib", "metadata.json"), JSON.stringify(meta, null, 2));
  console.log("wrote lib/metadata.json");
  fs.writeFileSync(path.join(ROOT, "data", "questions-full.json"), JSON.stringify(out));
  console.log("wrote data/questions-full.json (debug copy)");
}

main().catch((e) => { console.error(e); process.exit(1); });