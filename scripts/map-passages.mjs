import fs from 'fs';
import path from 'path';
const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
const passagesPath = path.join(process.cwd(), 'data', 'passages.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const passagesMap = JSON.parse(fs.readFileSync(passagesPath, 'utf8'));

// Group reading questions by package
const groups = {};
for (const q of questions) {
  if (q.section !== 'reading') continue;
  const key = `${q.level}/${q.examCode}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(q);
}

let updated = 0;
for (const [key, qs] of Object.entries(groups)) {
  const passages = passagesMap[key];
  if (!passages || passages.length === 0) continue;
  // Sort questions by id (which has order like -01, -02)
  qs.sort((a,b) => a.id.localeCompare(b.id));
  const perGroup = Math.floor(qs.length / passages.length);
  let idx = 0;
  for (let i = 0; i < passages.length; i++) {
    const end = i === passages.length - 1 ? qs.length : idx + perGroup;
    for (let j = idx; j < end; j++) {
      qs[j].passageHtml = passages[i];
      updated++;
    }
    idx = end;
  }
}

fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
console.log(`Updated ${updated} reading questions with passageHtml`);