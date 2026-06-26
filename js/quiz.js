import { pickRandomQuestions } from "./randomQuiz.js";

/**
 * Creates an in-memory quiz session.
 * @param {Array} questions
 * @param {number} count
 * @returns {Object}
 */
export function createQuizSession(questions, count) {
  return {
    questions: pickRandomQuestions(questions, count),
    currentIndex: 0,
    answers: {}
  };
}

/**
 * Returns the current question for a session.
 * @param {Object} session
 * @returns {Object|null}
 */
export function getCurrentQuestion(session) {
  return session.questions[session.currentIndex] || null;
}

/**
 * Saves a user's answer for the current question.
 * @param {Object} session
 * @param {string} questionId
 * @param {Array<string>} answers
 * @returns {Object}
 */
export function setQuestionAnswer(session, questionId, answers) {
  session.answers[questionId] = answers;
  return session;
}

/**
 * Moves the current index by a bounded step.
 * @param {Object} session
 * @param {number} step
 * @returns {Object}
 */
export function moveQuestion(session, step) {
  const lastIndex = session.questions.length - 1;
  session.currentIndex = Math.max(0, Math.min(lastIndex, session.currentIndex + step));
  return session;
}
