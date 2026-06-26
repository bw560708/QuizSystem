/**
 * Returns a shuffled copy of the provided array.
 * @param {Array} items
 * @returns {Array}
 */
export function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

/**
 * Picks unique random questions without repetition.
 * @param {Array} questions
 * @param {number} count
 * @returns {Array}
 */
export function pickRandomQuestions(questions, count) {
  return shuffle(questions).slice(0, Math.min(count, questions.length));
}
