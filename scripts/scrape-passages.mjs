import fs from 'fs';
import path from 'path';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'questions.json');
const OUT_PATH = path.join(process.cwd(), 'data', 'passages.json');

const data = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));

// Identify reading questions missing passage (no image, no long questionHtml)
const missing = data.filter(q =>
  q.section === 'reading' &&
  !q.image &&
  (!q.questionHtml || q.questionHtml.length < 100)
);

console.log(`Found ${missing.length} reading questions missing passage`);

// Group by level/examCode
const groups = {};
for (const q of missing) {
  const key = `${q.level}/${q.examCode}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(q);
}

console.log(`Groups: ${Object.keys(groups).length} packages`);

// For each group, fetch the page and extract passage
for (const [key, qs] of Object.entries(groups)) {
  const [level, examCode] = key.split('/');
  const url = `https://ten-jlpt-site.vercel.app/${level}/${examCode}/practice`;
  console.log(`Fetching ${url}...`);

  let html;
  try {
    const resp = await fetch(url);
    html = await resp.text();
  } catch (e) {
    console.error(`Failed to fetch ${url}: ${e.message}`);
    continue;
  }

  // Extract passages: look for "次の文章を読んで" and capture until next passage or question block
  // Simple regex: find all blocks between "次の文章を読んで" and a following "<div" that starts a question
  const passageRegex = /次の文章を読んで([\s\S]*?)(?=<div class="flex flex-col gap-2">|<div id="question-|$)/g;
  const matches = [...html.matchAll(passageRegex)];
  if (matches.length === 0) {
    console.log(`No passages found for ${key}`);
    continue;
  }

  // The passages are in order; assign to questions in order
  // Each passage likely corresponds to a group of questions; we'll assign the first passage to the first group of questions, etc.
  // We need to determine how many questions per passage. In the page, after each passage, there are questions.
  // We can count questions between passages by looking for question IDs.
  // Simpler: assume passages and questions are in the same order and each passage has a variable number of questions.
  // We'll store passages in a map and later assign.

  // Extract passage texts (clean up HTML tags)
  const passages = matches.map(m => m[1].replace(/<[^>]*>/g, '').trim());

  console.log(`Extracted ${passages.length} passages for ${key}`);

  // For now, we'll just store the passages in a JSON file for later manual mapping
  // We'll also update the questions with passageHtml if we can map.
  // Since mapping is complex, we'll just save passages for now.
  if (!fs.existsSync(OUT_PATH)) {
    fs.writeFileSync(OUT_PATH, JSON.stringify({}, null, 2));
  }
  const existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  existing[key] = passages;
  fs.writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2));
}

console.log('Done. Passages saved to data/passages.json');