#!/usr/bin/env node
// ponytail: fetch ten-jlpt-site.vercel.app rendered RSC and extract sections. No extra deps.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qPath = path.join(__dirname, "../data/questions.json");

// levels and counts seen on https://ten-jlpt-site.vercel.app (N5 2, N4 10, N3 29, N2 30, N1 30)
const LEVELS = {
  N5: 2,
  N4: 10,
  N3: 29,
  N2: 30,
  N1: 30,
};

const SECTION_MAP = {
  vocab: "vocab",
  reading: "reading", // ten-site reading = bunpo+dokkai
  listening: "listening",
  // fallback: grammar -> grammar
};

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchExamList(level) {
  const html = await fetch(`https://ten-jlpt-site.vercel.app/${level}`).then(r=>r.text());
  const re = new RegExp(`href="/${level}/([^"/]+)"`, "g");
  const codes = new Set();
  for (const m of html.matchAll(re)) {
    const code = m[1].split("?")[0].split("#")[0];
    if (code && code !== level && !code.includes(".")) {
      // filter out "practice" suffix already split? href "/N4/12_2024/practice" gives "12_2024"
      codes.add(code);
    }
  }
  return [...codes];
}

async function fetchExam(level, examCode) {
  const url = `https://ten-jlpt-site.vercel.app/${level}/${examCode}`;
  const html = await fetch(url).then(r=>{
    if(!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return r.text();
  });
  // RSC pushes: self.__next_f.push([1,"..."])
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,(".*?")\]\)/gs)];
  const allSections = [];
  for (const p of pushes) {
    try {
      const s = JSON.parse(p[1]);
      if (!s.includes('"sections"') || !s.includes('"questionCount"')) continue;
      // There may be multiple sections arrays in same push; find all
      let idx = 0;
      while ((idx = s.indexOf('"sections":', idx)) !== -1) {
        let start = s.indexOf("[", idx);
        if (start === -1) break;
        let depth=0, end=start, inStr=false, esc=false;
        for (let i=start;i<s.length;i++) {
          const ch=s[i];
          if(inStr){ if(esc) esc=false; else if(ch==='\\') esc=true; else if(ch==='"') inStr=false; }
          else { if(ch==='"') inStr=true; else if(ch==='[') depth++; else if(ch===']'){depth--; if(depth===0){end=i;break;}}}
        }
        if (depth!==0) break;
        const arrStr = s.slice(start, end+1);
        try {
          const arr = JSON.parse(arrStr);
          if (Array.isArray(arr)) for (const sec of arr) if (sec.questionCount) allSections.push(sec);
        } catch {}
        idx = end+1;
      }
    } catch {}
  }
  if (allSections.length===0) throw new Error(`sections not found ${level}/${examCode}`);
  return allSections;
}

function mapSection(sec) {
  if (sec === "vocab") return "vocab";
  if (sec === "reading") return "reading";
  if (sec === "listening") return "listening";
  if (sec === "grammar") return "grammar";
  return "reading";
}

function cleanText(html) {
  if (!html) return "";
  if (typeof html !== 'string') html = String(html);
  return html.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
}

function toQuestion(level, examCode, sec, q, secMedia) {
  const secMapped = mapSection(sec);
  let year;
  if (/^\d{2}_\d{4}$/.test(examCode)) year = parseInt(examCode.split("_")[1],10);
  else if (examCode.startsWith("test_")) { const num = parseInt(examCode.split("_")[1],10); year = 2019 + (num-1); }
  else year = 2019;
  const id = `${level.toLowerCase()}-${examCode}-${secMapped}-${String(q.order).padStart(2,"0")}`;
  const rawHtml = q.prompt?.html || q.prompt?.text || q.context?.html || "";
  const question = cleanText(rawHtml) || cleanText(q.context || q.instruction || "");
  const questionHtml = rawHtml && rawHtml.includes("<") ? rawHtml : null; // ponytail: keep underline <u>
  const options = q.options.map(o=> cleanText(o.html || o.text));
  while (options.length < 4) options.push("");
  const answer = Math.max(0, (q.correctOption ?? 1) - 1);
  const explanation = q.explanation ? cleanText(q.explanation) : "";
  const out = {
    id, exam: "JLPT", level, year, section: secMapped,
    question: question || `(${secMapped}) Q${q.order}`,
    options: options.slice(0,4), answer,
    explanation: explanation || `Kunci: ${answer+1}. Sumber ten-site ${level}/${examCode} ${sec}`,
    sourceNote: `ten-site ${level}/${examCode} ${sec} Q${q.order} (${secMapped})`,
    examCode,
  };
  if (questionHtml) out.questionHtml = questionHtml;
  const qImg = q.media?.images?.[0]?.hostUrl || q.media?.images?.[0]?.assetKey;
  const secImg = secMedia?.images?.[q.order-1]?.hostUrl || secMedia?.images?.[0]?.hostUrl;
  if (qImg) out.image = qImg;
  else if (secImg) out.image = secImg;
  else {
    const ctxHtml = typeof q.context === "string" ? q.context : q.context?.html || "";
    if (ctxHtml.includes("<img")) {
      const m = ctxHtml.match(/src="([^"]+)"/);
      if (m) out.image = m[1];
    }
  }
  // audio: per-question object or section array
  const qAudio = q.media?.audio?.hostUrl || (Array.isArray(q.media?.audio) ? q.media.audio[0]?.hostUrl : null);
  const secAudio = Array.isArray(secMedia?.audio) ? secMedia.audio[q.order-1]?.hostUrl || secMedia.audio[0]?.hostUrl : secMedia?.audio?.hostUrl;
  if (qAudio) out.audio = qAudio;
  else if (secAudio) out.audio = secAudio;
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const levelArg = args.find(a=> a.startsWith("--level="))?.split("=")[1]?.toUpperCase();
  const examArg = args.find(a=> a.startsWith("--exam="))?.split("=")[1];
  const outPathArg = args.find(a=> a.startsWith("--out="))?.split("=")[1];

  const levels = levelArg ? [levelArg] : Object.keys(LEVELS);
  const allQs = [];

  for (const level of levels) {
    let exams;
    if (examArg) exams = [examArg];
    else {
      try {
        const list = await fetchExamList(level);
        exams = list.length ? list : Array.from({length:LEVELS[level]},(_,i)=>`test_${i+1}`);
        console.log(`discovered ${level}: ${exams.join(", ")}`);
      } catch(e) {
        console.error(`  list fail ${level}`, e.message);
        exams = Array.from({length:LEVELS[level]},(_,i)=>`test_${i+1}`);
      }
    }
    for (const examCode of exams) {
      console.log(`fetch ${level}/${examCode} ...`);
      try {
        const sections = await fetchExam(level, examCode);
        console.log(`  sections: ${sections.map(s=>`${s.section}:${s.questionCount}`).join(", ")}`);
        for (const sec of sections) {
          const secName = sec.section;
          for (const q of sec.questions || []) {
            const mapped = toQuestion(level, examCode, secName, q, sec.media);
            allQs.push(mapped);
          }
        }
      } catch(e) {
        console.error(`  fail ${level}/${examCode}:`, e.message);
      }
      await sleep(600); // be nice
    }
  }

  console.log(`\ntotal fetched ${allQs.length} questions`);
  const byLevel = {};
  for (const q of allQs) byLevel[q.level]=(byLevel[q.level]||0)+1;
  console.log(byLevel);
  const bySec = {};
  for (const q of allQs) {
    const k=`${q.level}-${q.section}`;
    bySec[k]=(bySec[k]||0)+1;
  }
  console.log(bySec);

  if (dry) {
    console.log("\n--dry, not writing. Sample:");
    console.log(JSON.stringify(allQs.slice(0,2), null, 2));
    return;
  }

  const outPath = outPathArg ? path.resolve(outPathArg) : qPath;
  // merge with existing if not --replace
  const replace = args.includes("--replace");
  let existing = [];
  if (!replace && fs.existsSync(outPath)) {
    try { existing = JSON.parse(fs.readFileSync(outPath,"utf8")); } catch {}
  }
  const merged = replace ? allQs : [...existing, ...allQs];
  // dedup by id
  const seen = new Set(); const out=[];
  for (const q of merged) if(!seen.has(q.id)){ seen.add(q.id); out.push(q); }
  const order = {vocab:0, grammar:1, reading:2, listening:3};
  out.sort((a,b)=> a.level.localeCompare(b.level) || (a.examCode||"").localeCompare(b.examCode||"") || (order[a.section]??9)-(order[b.section]??9) || a.id.localeCompare(b.id));
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`wrote ${out.length} to ${outPath}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
