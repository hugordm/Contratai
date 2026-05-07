import { enneagramQuestions } from "./questions";

export interface EnneagramResult {
  dominant: number;
  wing: number;
  scores: Record<number, number>;
  answers: Record<number, number>;
}

export function calculateEnneagram(answers: Record<number, number>): EnneagramResult {
  const scores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  enneagramQuestions.forEach((q) => {
    const score = answers[q.id] ?? 0;
    scores[q.tipo] += score;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dominant = parseInt(sorted[0][0]);

  // Wing: adjacent type with highest score (wraps 9→1 and 1→9)
  const wingA = dominant === 1 ? 9 : dominant - 1;
  const wingB = dominant === 9 ? 1 : dominant + 1;
  const wing = scores[wingA] >= scores[wingB] ? wingA : wingB;

  return { dominant, wing, scores, answers };
}
