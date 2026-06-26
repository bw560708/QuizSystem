import { createQuestion } from "./excelImport.js";

const CSV_COLUMN_NAMES = ["題目", "選項A", "選項B", "選項C", "選項D", "正確答案"];

/**
 * Converts CSV text into imported question objects.
 * @param {string} csvText
 * @returns {Array}
 */
export function parseCsvQuestions(csvText) {
  const rows = parseCsvRows(removeBom(csvText)).filter((row) => row.some((value) => String(value || "").trim()));
  const dataRows = hasHeaderRow(rows[0]) ? rows.slice(1) : rows;
  return dataRows.map((row) => {
    const [question, optionA, optionB, optionC, optionD, answerText] = row;
    return createQuestion(question, { A: optionA, B: optionB, C: optionC, D: optionD }, parseAnswerText(answerText));
  }).filter((question) => question.question && question.answers.length);
}

/**
 * Parses RFC 4180-style CSV rows with quoted fields.
 * @param {string} text
 * @returns {Array<Array<string>>}
 */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Checks whether the first row is the expected header row.
 * @param {Array<string>} row
 * @returns {boolean}
 */
function hasHeaderRow(row = []) {
  return CSV_COLUMN_NAMES.every((name, index) => String(row[index] || "").trim() === name);
}

/**
 * Parses answer text such as A or A,C,D.
 * @param {string} answerText
 * @returns {Array<string>}
 */
function parseAnswerText(answerText) {
  return String(answerText || "")
    .split(",")
    .map((answer) => answer.trim().toUpperCase())
    .filter((answer) => ["A", "B", "C", "D"].includes(answer));
}

/**
 * Removes a UTF-8 byte order mark from CSV text.
 * @param {string} text
 * @returns {string}
 */
function removeBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

