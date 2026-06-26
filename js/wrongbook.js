import { getWrongRecords, saveWrongRecords } from "./storage.js";

/**
 * Updates wrong-answer records after quiz submission.
 * @param {Array} scoreDetails
 * @returns {Object}
 */
export function updateWrongRecords(scoreDetails) {
  const records = getWrongRecords();
  scoreDetails.forEach((detail) => {
    const id = detail.question.id;
    if (detail.correct) {
      delete records[id];
      return;
    }
    const existing = records[id] || { errorCount: 0 };
    records[id] = {
      questionId: id,
      questionText: detail.question.question,
      correctAnswers: detail.correctAnswers,
      userAnswers: detail.userAnswers,
      errorCount: existing.errorCount + 1,
      updatedAt: new Date().toISOString()
    };
  });
  saveWrongRecords(records);
  return records;
}

/**
 * Builds wrong-book rows by joining records with current question data.
 * @param {Array} questions
 * @returns {Array}
 */
export function getWrongBookItems(questions) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  return Object.values(getWrongRecords())
    .map((record) => ({
      ...record,
      question: questionMap.get(record.questionId),
      isImportant: record.errorCount >= 5
    }))
    .filter((item) => item.question)
    .sort((first, second) => second.errorCount - first.errorCount);
}

/**
 * Clears one wrong-answer record.
 * @param {string} questionId
 * @returns {Object}
 */
export function clearWrongRecord(questionId) {
  const records = getWrongRecords();
  delete records[questionId];
  saveWrongRecords(records);
  return records;
}

/**
 * Clears all wrong-answer records.
 * @returns {void}
 */
export function clearAllWrongRecords() {
  saveWrongRecords({});
}
