export interface ScoreResult {
  score: number;
  maxScore: number;
}

/**
 * Score an exam attempt. `maxScore` is the number of questions; `score` counts
 * answers matching the correct index. A missing/blank answer counts as wrong.
 */
export function scoreAttempt(correctIndexes: number[], answers: number[]): ScoreResult {
  const maxScore = correctIndexes.length;
  let score = 0;
  for (let i = 0; i < correctIndexes.length; i++) {
    if (answers[i] === correctIndexes[i]) score++;
  }
  return { score, maxScore };
}
