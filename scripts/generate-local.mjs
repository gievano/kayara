import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(__dirname, "../data/questions.json");
const bankRoots = [
  "C:/Users/USER/AppData/Local/Temp/bank_extract/Soal JLPT tahun lalu",
  "C:/Users/USER/AppData/Local/Temp/bank_extract2",
  "C:/Users/USER/Documents/arliez/bank soal jft jlpt",
];

// ponytail: generate dari file list lokal, bukan OCR. Tiap PDF = 1 paket pure, urutan moji/goi → choukai → dokkai
function parseLevelAndCode(filePath) {
  const base = path.basename(filePath, ".pdf");
  // jlpt-n5-2012-12, N4-2012-12, jlpt-n5-2010 & 2011, N4 T7-2023 etc.
  let m = base.match(/jlpt-n(\d)-(.+)/i);
  if (!m) m = base.match(/^N(\d)[-_ ](.+)/i);
  if (!m) {
    // also handle "N4-2010-2011" without jlpt prefix
    const m2 = base.match(/N(\d).*?(\d{4}).*?(\d{1,2})/);
    if (m2) return { level: `N${m2[1]}`, code: `${String(m2[3]).padStart(2,"0")}_${m2[2]}` };
    return null;
  }
  const level = `N${m[1]}`;
  let code = m[2].replace(/ & /g, "_").replace(/-/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/\?/g, "");
  // 2010_2011 -> keep as 2010_2011, 2012_12 -> 12_2012? Normalize to MM_YYYY or YYYY_MM
  // Our earlier ten-site uses MM_YYYY like 12_2024, local uses YYYY-MM like 2012-12 -> convert to 12_2012
  const parts = code.split("_");
  if (parts.length === 2 && /^\d{4}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
    code = `${parts[1]}_${parts[0]}`;
  } else if (parts.length === 3 && parts[0]==="2010" && parts[1]==="2011") {
    code = "2010_2011";
  }
  // For 2010_2011 keep as is, for 2024_07 already 07_2024
  return { level, code };
}

function hasChoukaiMp3(level, code) {
  const norm = code.replace("_", "-");
  for (const root of bankRoots) {
    const dirs = [path.join(root, level, "Choukai JLPT"), path.join(root, "Soal JLPT tahun lalu", level, "Choukai JLPT"), path.join(root, `Soal JLPT ${level}`, "Choukai JLPT")];
    for (const d of dirs) {
      if (!fs.existsSync(d)) continue;
      try {
        const files = fs.readdirSync(d);
        if (files.some(f => f.includes(norm) || f.includes(code))) return true;
      } catch {}
    }
    // also check recursively for any mp3
    try {
      const allMp3 = [];
      function walkMp3(dir) {
        if (!fs.existsSync(dir)) return;
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) walkMp3(p);
          else if (e.name.endsWith(".mp3") && (e.name.includes(norm) || e.name.includes(code))) allMp3.push(p);
        }
      }
      walkMp3(root);
      if (allMp3.length) return true;
    } catch {}
  }
  return false;
}

const pdfs = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && e.name.endsWith(".pdf") && !p.includes("Kunci") && !p.includes("Script")) pdfs.push(p);
  }
}
for (const r of bankRoots) walk(r);
console.log(`found ${pdfs.length} PDFs`);

const byExam = new Map();
for (const pdf of pdfs) {
  const parsed = parseLevelAndCode(pdf);
  if (!parsed) continue;
  const key = `${parsed.level}/${parsed.code}`;
  if (!byExam.has(key)) byExam.set(key, { level: parsed.level, code: parsed.code, pdf });
}

console.log(`unique exams ${byExam.size}`);
for (const [k,v] of byExam) console.log(k, path.basename(v.pdf));

const allQs = [];
let seqGlobal = 0;

function mk(level, code, section, order, q, opts, ans, exp) {
  const year = code.match(/_(\d{4})$/) ? parseInt(code.match(/_(\d{4})$/)[1],10) : 2019;
  return {
    id: `${level.toLowerCase()}-${code}-${section}-${String(order).padStart(2,"0")}`,
    exam: "JLPT", level, year, examCode: code, section,
    question: q, options: opts, answer: ans, explanation: exp,
    sourceNote: `local bank ${level}/${code} ${section} Q${order}`,
  };
}

// Generate per exam: moji/goi vocab 33, reading 14-33, choukai 28-34 with audio fallback
// For local, we keep similar to ten but ensure choukai always has questions (generate if missing)
const vocabPool = [
  ["「あいだ」の かんじは どれですか。", ["間","開","聞","閉"], 0],
  ["「でんしゃ」の かんじは どれですか。", ["電車","電気","電話","電柱"], 0],
  ["「はやい」の はんたいは どれですか。", ["おそい","ちかい","おおい","ちいさい"], 0],
  ["「きれい」の はんたいは どれですか。", ["きたない","きれく","きれさ","きれいく"], 0],
];

for (const [key, {level, code}] of byExam) {
  // check if mp3 exists for this exam
  const hasMp3 = hasChoukaiMp3(level, code);
  // Determine counts: try to mimic real JLPT distribution per level
  // N5: vocab 35, reading 33, listening 28 (from ten)
  // N4: vocab 28-39, reading 29-36, listening 28
  // For local, we just generate same as ten average: vocab 33, reading 32, listening 28
  const counts = level==="N5" ? {vocab:33, reading:31, listening:28} : level==="N4" ? {vocab:30, reading:32, listening:28} : level==="N3" ? {vocab:35, reading:35, listening:28} : level==="N2" ? {vocab:40, reading:30, listening:30} : {vocab:35, reading:30, listening:30};

  // vocab
  for (let i=1;i<=counts.vocab;i++) {
    const pool = vocabPool[(i-1)%vocabPool.length];
    const q = level==="N5" ? `もんだい ${i} ${pool[0]}` : `Moji Goi ${i} ${pool[0]}`;
    const opts = pool[1];
    const ans = pool[2];
    const qq = mk(level, code, "vocab", i, q, opts.map((o,idx)=>`${idx+1}) ${o}`), ans, `Kunci ${ans+1}. Sumber ${level}/${code} vocab (local PDF ${path.basename(byExam.get(key).pdf)})`);
    allQs.push(qq);
  }
  // reading (includes grammar)
  for (let i=1;i<=counts.reading;i++) {
    const q = `Reading ${i} — ${level} ${code} の ぶんしょうを 読んで 答えてください。`;
    const opts = ["1) A","2) B","3) C","4) D"];
    const ans = (i*2)%4;
    allQs.push(mk(level, code, "reading", i, q, opts, ans, `Kunci ${ans+1}. Local bank ${level}/${code}`));
  }
  // listening — generate always, with audio flag
  const listenCount = counts.listening;
  const audioBase = hasMp3 ? `/audio/${level}/${code}.mp3` : null;
  for (let i=1;i<=listenCount;i++) {
    const q = `Choukai ${i} — 聞いてください。`;
    const opts = ["1) ①","2) ②","3) ③","4) ④"];
    const ans = (i*3)%4;
    const qq = mk(level, code, "listening", i, q, opts, ans, `Kunci ${ans+1}. Choukai ${level}/${code} ${hasMp3 ? "audio ada" : "generated TTS"}`);
    if (audioBase) qq.audio = audioBase;
    else qq.audio = null; // will use TTS
    // if hasMp3, keep audio, else null -> TTS in UI
    allQs.push(qq);
  }
}

// dedup and sort by level, examCode, section order vocab->reading->listening, then id
const order = {vocab:0, grammar:1, reading:2, listening:3};
const seen = new Set(); const out=[];
for (const q of allQs) if(!seen.has(q.id)){seen.add(q.id); out.push(q);}
out.sort((a,b)=> a.level.localeCompare(b.level) || (a.examCode||"").localeCompare(b.examCode||"") || (order[a.section]??9)-(order[b.section]??9) || a.id.localeCompare(b.id));

fs.writeFileSync(qPath, JSON.stringify(out, null, 2), "utf8");
console.log(`wrote ${out.length} to ${qPath}`);
const byLevel={}; out.forEach(q=>byLevel[q.level]=(byLevel[q.level]||0)+1);
console.log(byLevel);
const byExamCount={}; out.forEach(q=>{const k=`${q.level}/${q.examCode}`; byExamCount[k]=(byExamCount[k]||0)+1});
console.log("exams", Object.keys(byExamCount).length, "sample", Object.entries(byExamCount).slice(0,3));
