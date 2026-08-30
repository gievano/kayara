import type { Question, Section } from "./questions";

export type Result = {
  total: number;
  correct: number;
  wrong: number;
  score: number; // 0-100
  perSection: Record<Section, { total: number; correct: number }>;
  details: {
    question: Question;
    picked: number | null;
    isCorrect: boolean;
  }[];
};

export function calcScore(questions: Question[], answers: (number | null)[]): Result {
  const perSection: Record<Section, { total: number; correct: number }> = {
    vocab: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    reading: { total: 0, correct: 0 },
    listening: { total: 0, correct: 0 },
  };

  let correct = 0;
  const details = questions.map((q, i) => {
    perSection[q.section].total++;
    const picked = answers[i] ?? null;
    const isCorrect = picked === q.answer;
    if (isCorrect) {
      correct++;
      perSection[q.section].correct++;
    }
    return { question: q, picked, isCorrect };
  });

  return {
    total: questions.length,
    correct,
    wrong: questions.length - correct,
    score: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    perSection,
    details,
  };
}
