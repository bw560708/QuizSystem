/**
 * Normalizes an answer array for comparison and display.
 * @param {Array<string>} answers
 * @returns {Array<string>}
 */
export function normalizeAnswers(answers) {
  return [...new Set((answers || []).map((answer) => String(answer).trim().toUpperCase()).filter(Boolean))].sort();
}

/**
 * Checks if a user answer exactly matches the correct answer.
 * @param {Array<string>} userAnswers
 * @param {Array<string>} correctAnswers
 * @returns {boolean}
 */
export function isCorrectAnswer(userAnswers, correctAnswers) {
  const normalizedUserAnswers = normalizeAnswers(userAnswers);
  const normalizedCorrectAnswers = normalizeAnswers(correctAnswers);
  return normalizedUserAnswers.length === normalizedCorrectAnswers.length
    && normalizedUserAnswers.every((answer, index) => answer === normalizedCorrectAnswers[index]);
}

/**
 * Scores a completed quiz.
 * @param {Array} questions
 * @param {Object} answersByQuestionId
 * @param {number} fullScore
 * @returns {Object}
 */
export function scoreQuiz(questions, answersByQuestionId, fullScore) {
  const perQuestionScore = questions.length ? Number(fullScore) / questions.length : 0;
  const details = questions.map((question) => {
    const userAnswers = normalizeAnswers(answersByQuestionId[question.id] || []);
    const correctAnswers = normalizeAnswers(question.answers);
    const correct = isCorrectAnswer(userAnswers, correctAnswers);
    return {
      question,
      userAnswers,
      correctAnswers,
      correct,
      earnedScore: correct ? perQuestionScore : 0
    };
  });
  const correctCount = details.filter((detail) => detail.correct).length;
  const wrongCount = details.length - correctCount;
  const totalScore = details.reduce((sum, detail) => sum + detail.earnedScore, 0);
  const accuracy = details.length ? (correctCount / details.length) * 100 : 0;

  return {
    fullScore: Number(fullScore),
    perQuestionScore,
    totalScore,
    correctCount,
    wrongCount,
    accuracy,
    details
  };
}
