const STORAGE_KEYS = {
  questions: "quizSystem.questions",
  wrongRecords: "quizSystem.wrongRecords",
  histories: "quizSystem.histories",
  settings: "quizSystem.settings"
};

/**
 * Reads JSON data from localStorage and returns a fallback if parsing fails.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function readStorage(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Writes serializable data into localStorage.
 * @param {string} key
 * @param {*} value
 * @returns {void}
 */
export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Returns all saved questions.
 * @returns {Array}
 */
export function getQuestions() {
  const questions = readStorage(STORAGE_KEYS.questions, []);
  const normalizedQuestions = normalizeQuestionIds(questions);
  const changed = questions.some((question, index) => String(question.id) !== String(normalizedQuestions[index]?.id));
  if (changed) {
    saveQuestions(normalizedQuestions);
  }
  return normalizedQuestions;
}

/**
 * Replaces the full question bank.
 * @param {Array} questions
 * @returns {void}
 */
export function saveQuestions(questions) {
  writeStorage(STORAGE_KEYS.questions, questions);
}

/**
 * Adds imported questions to the current bank and assigns numeric serial IDs.
 * @param {Array} questions
 * @returns {Array}
 */
export function appendQuestions(questions) {
  const currentQuestions = normalizeQuestionIds(getQuestions());
  const nextId = getNextQuestionId(currentQuestions);
  const importedQuestions = questions.map((question, index) => ({
    ...question,
    id: String(nextId + index)
  }));
  const mergedQuestions = [...currentQuestions, ...importedQuestions];
  saveQuestions(mergedQuestions);
  return mergedQuestions;
}

/**
 * Ensures existing question IDs are numeric serial IDs.
 * @param {Array} questions
 * @returns {Array}
 */
function normalizeQuestionIds(questions) {
  let nextId = 1;
  return questions.map((question) => {
    const numericId = Number(question.id);
    if (Number.isInteger(numericId) && numericId > 0) {
      nextId = Math.max(nextId, numericId + 1);
      return { ...question, id: String(numericId) };
    }
    const assignedQuestion = { ...question, id: String(nextId) };
    nextId += 1;
    return assignedQuestion;
  });
}

/**
 * Returns the next available numeric question ID.
 * @param {Array} questions
 * @returns {number}
 */
function getNextQuestionId(questions) {
  const maxId = questions.reduce((max, question) => {
    const numericId = Number(question.id);
    return Number.isInteger(numericId) && numericId > 0 ? Math.max(max, numericId) : max;
  }, 0);
  return maxId + 1;
}

/**
 * Removes all questions from localStorage.
 * @returns {void}
 */
export function clearQuestions() {
  saveQuestions([]);
}

/**
 * Returns saved wrong-answer records by question ID.
 * @returns {Object}
 */
export function getWrongRecords() {
  return readStorage(STORAGE_KEYS.wrongRecords, {});
}

/**
 * Replaces all wrong-answer records.
 * @param {Object} records
 * @returns {void}
 */
export function saveWrongRecords(records) {
  writeStorage(STORAGE_KEYS.wrongRecords, records);
}

/**
 * Returns quiz histories.
 * @returns {Array}
 */
export function getHistories() {
  return readStorage(STORAGE_KEYS.histories, []);
}

/**
 * Adds a quiz history record.
 * @param {Object} history
 * @returns {Array}
 */
export function addHistory(history) {
  const histories = [history, ...getHistories()].slice(0, 50);
  writeStorage(STORAGE_KEYS.histories, histories);
  return histories;
}

/**
 * Returns persisted user settings.
 * @returns {Object}
 */
export function getSettings() {
  return readStorage(STORAGE_KEYS.settings, { fullScore: 100 });
}

/**
 * Saves user settings.
 * @param {Object} settings
 * @returns {void}
 */
export function saveSettings(settings) {
  writeStorage(STORAGE_KEYS.settings, settings);
}


