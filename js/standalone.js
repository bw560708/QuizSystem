(function () {
  'use strict';
  if (window.quizSystemModuleLoaded || window.quizSystemStandaloneLoaded) { return; }
  window.quizSystemStandaloneLoaded = true;

/* Source: storage.js */
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
function readStorage(key, fallback) {
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
function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Returns all saved questions.
 * @returns {Array}
 */
function getQuestions() {
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
function saveQuestions(questions) {
  writeStorage(STORAGE_KEYS.questions, questions);
}

/**
 * Adds imported questions to the current bank and assigns numeric serial IDs.
 * @param {Array} questions
 * @returns {Array}
 */
function appendQuestions(questions) {
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
function clearQuestions() {
  saveQuestions([]);
}

/**
 * Returns saved wrong-answer records by question ID.
 * @returns {Object}
 */
function getWrongRecords() {
  return readStorage(STORAGE_KEYS.wrongRecords, {});
}

/**
 * Replaces all wrong-answer records.
 * @param {Object} records
 * @returns {void}
 */
function saveWrongRecords(records) {
  writeStorage(STORAGE_KEYS.wrongRecords, records);
}

/**
 * Returns quiz histories.
 * @returns {Array}
 */
function getHistories() {
  return readStorage(STORAGE_KEYS.histories, []);
}

/**
 * Adds a quiz history record.
 * @param {Object} history
 * @returns {Array}
 */
function addHistory(history) {
  const histories = [history, ...getHistories()].slice(0, 50);
  writeStorage(STORAGE_KEYS.histories, histories);
  return histories;
}

/**
 * Returns persisted user settings.
 * @returns {Object}
 */
function getSettings() {
  return readStorage(STORAGE_KEYS.settings, { fullScore: 100 });
}

/**
 * Saves user settings.
 * @param {Object} settings
 * @returns {void}
 */
function saveSettings(settings) {
  writeStorage(STORAGE_KEYS.settings, settings);
}




/* Source: randomQuiz.js */
/**
 * Returns a shuffled copy of the provided array.
 * @param {Array} items
 * @returns {Array}
 */
function shuffle(items) {
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
function pickRandomQuestions(questions, count) {
  return shuffle(questions).slice(0, Math.min(count, questions.length));
}


/* Source: scoring.js */
/**
 * Normalizes an answer array for comparison and display.
 * @param {Array<string>} answers
 * @returns {Array<string>}
 */
function normalizeAnswers(answers) {
  return [...new Set((answers || []).map((answer) => String(answer).trim().toUpperCase()).filter(Boolean))].sort();
}

/**
 * Checks if a user answer exactly matches the correct answer.
 * @param {Array<string>} userAnswers
 * @param {Array<string>} correctAnswers
 * @returns {boolean}
 */
function isCorrectAnswer(userAnswers, correctAnswers) {
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
function scoreQuiz(questions, answersByQuestionId, fullScore) {
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


/* Source: wrongbook.js */

/**
 * Updates wrong-answer records after quiz submission.
 * @param {Array} scoreDetails
 * @returns {Object}
 */
function updateWrongRecords(scoreDetails) {
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
function getWrongBookItems(questions) {
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
function clearWrongRecord(questionId) {
  const records = getWrongRecords();
  delete records[questionId];
  saveWrongRecords(records);
  return records;
}

/**
 * Clears all wrong-answer records.
 * @returns {void}
 */
function clearAllWrongRecords() {
  saveWrongRecords({});
}


/* Source: quiz.js */

/**
 * Creates an in-memory quiz session.
 * @param {Array} questions
 * @param {number} count
 * @returns {Object}
 */
function createQuizSession(questions, count) {
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
function getCurrentQuestion(session) {
  return session.questions[session.currentIndex] || null;
}

/**
 * Saves a user's answer for the current question.
 * @param {Object} session
 * @param {string} questionId
 * @param {Array<string>} answers
 * @returns {Object}
 */
function setQuestionAnswer(session, questionId, answers) {
  session.answers[questionId] = answers;
  return session;
}

/**
 * Moves the current index by a bounded step.
 * @param {Object} session
 * @param {number} step
 * @returns {Object}
 */
function moveQuestion(session, step) {
  const lastIndex = session.questions.length - 1;
  session.currentIndex = Math.max(0, Math.min(lastIndex, session.currentIndex + step));
  return session;
}


/* Source: excelImport.js */
const COLUMN_NAMES = ["題目", "選項A", "選項B", "選項C", "選項D", "正確答案"];
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

/**
 * Converts an ArrayBuffer into imported question objects.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Array>}
 */
async function parseExcelQuestions(buffer) {
  const entries = await unzipXlsx(buffer);
  const workbook = parseXml(entries.get("xl/workbook.xml"));
  const relationXml = parseXml(entries.get("xl/_rels/workbook.xml.rels"));
  const sharedStrings = entries.has("xl/sharedStrings.xml")
    ? parseSharedStrings(parseXml(entries.get("xl/sharedStrings.xml")))
    : [];
  const firstSheetPath = getFirstWorksheetPath(workbook, relationXml);
  const sheetXml = parseXml(entries.get(firstSheetPath));
  const rows = parseRows(sheetXml, sharedStrings);
  return normalizeRows(rows);
}

/**
 * Creates application-ready question objects from sample JSON rows.
 * @param {Array} rows
 * @returns {Array}
 */
function normalizeSampleQuestions(rows) {
  return rows.map((row) => createQuestion(row.question, row.options, row.answers));
}

/**
 * Generates a unique question ID.
 * @returns {string}
 */
function createQuestionId() {
  return `Q-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
}

/**
 * Parses a ZIP-based XLSX file and returns text entries.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Map<string, string>>}
 */
async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const entries = new Map();
  let offset = 0;
  const centralEntries = readCentralDirectory(bytes);

  if (centralEntries.length) {
    for (const entry of centralEntries) {
      if (!entry.fileName.endsWith("/")) {
        const data = await readZipEntry(bytes, entry);
        entries.set(entry.fileName, decodeText(data));
      }
    }
    return entries;
  }

  while (offset < bytes.length - 30) {
    const signature = readUint32(bytes, offset);
    if (signature !== LOCAL_FILE_SIGNATURE) {
      offset += 1;
      continue;
    }

    const compressionMethod = readUint16(bytes, offset + 8);
    const compressedSize = readUint32(bytes, offset + 18);
    const fileNameLength = readUint16(bytes, offset + 26);
    const extraLength = readUint16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const fileName = decodeText(bytes.slice(nameStart, nameStart + fileNameLength));
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    if (!fileName.endsWith("/")) {
      const data = compressionMethod === 0
        ? compressedData
        : await inflateRaw(compressedData);
      entries.set(fileName, decodeText(data));
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

/**
 * Reads ZIP central directory entries for XLSX files with data descriptors.
 * @param {Uint8Array} bytes
 * @returns {Array<Object>}
 */
function readCentralDirectory(bytes) {
  const entries = [];
  let offset = 0;

  while (offset < bytes.length - 46) {
    if (readUint32(bytes, offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      offset += 1;
      continue;
    }

    const compressionMethod = readUint16(bytes, offset + 10);
    const compressedSize = readUint32(bytes, offset + 20);
    const fileNameLength = readUint16(bytes, offset + 28);
    const extraLength = readUint16(bytes, offset + 30);
    const commentLength = readUint16(bytes, offset + 32);
    const localHeaderOffset = readUint32(bytes, offset + 42);
    const fileNameStart = offset + 46;
    const fileName = decodeText(bytes.slice(fileNameStart, fileNameStart + fileNameLength));

    entries.push({
      fileName,
      compressionMethod,
      compressedSize,
      localHeaderOffset
    });
    offset = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

/**
 * Reads one ZIP entry from its local file header.
 * @param {Uint8Array} bytes
 * @param {Object} entry
 * @returns {Promise<Uint8Array>}
 */
async function readZipEntry(bytes, entry) {
  const offset = entry.localHeaderOffset;
  if (readUint32(bytes, offset) !== LOCAL_FILE_SIGNATURE) {
    throw new Error("Excel 檔案格式無法解析。");
  }

  const fileNameLength = readUint16(bytes, offset + 26);
  const extraLength = readUint16(bytes, offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressedData = bytes.slice(dataStart, dataStart + entry.compressedSize);
  return entry.compressionMethod === 0 ? compressedData : inflateRaw(compressedData);
}
/**
 * Inflates raw DEFLATE data by using the browser stream API.
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
async function inflateRaw(data) {
  if (!("DecompressionStream" in window)) {
    throw new Error("此瀏覽器不支援離線解析 xlsx 所需的 DecompressionStream。");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Parses XML text into a document.
 * @param {string} xmlText
 * @returns {Document}
 */
function parseXml(xmlText) {
  if (!xmlText) {
    throw new Error("Excel 檔案缺少必要工作表資料。");
  }
  return new DOMParser().parseFromString(xmlText, "application/xml");
}

/**
 * Extracts shared string values from the workbook.
 * @param {Document} xml
 * @returns {Array<string>}
 */
function parseSharedStrings(xml) {
  return [...xml.getElementsByTagName("si")].map((item) => [...item.getElementsByTagName("t")]
    .map((node) => node.textContent || "")
    .join(""));
}

/**
 * Resolves the first worksheet path from workbook relationships.
 * @param {Document} workbook
 * @param {Document} relationXml
 * @returns {string}
 */
function getFirstWorksheetPath(workbook, relationXml) {
  const sheet = workbook.getElementsByTagName("sheet")[0];
  const relationId = sheet?.getAttribute("r:id");
  const relationship = [...relationXml.getElementsByTagName("Relationship")]
    .find((item) => item.getAttribute("Id") === relationId);
  const target = relationship?.getAttribute("Target") || "worksheets/sheet1.xml";
  return target.startsWith("xl/") ? target : `xl/${target.replace(/^\//, "")}`;
}

/**
 * Extracts worksheet rows as plain string arrays.
 * @param {Document} sheetXml
 * @param {Array<string>} sharedStrings
 * @returns {Array<Array<string>>}
 */
function parseRows(sheetXml, sharedStrings) {
  return [...sheetXml.getElementsByTagName("row")].map((row) => {
    const cells = [...row.getElementsByTagName("c")];
    const values = [];
    cells.forEach((cell) => {
      const reference = cell.getAttribute("r") || "";
      const columnIndex = columnNameToIndex(reference.replace(/[0-9]/g, ""));
      values[columnIndex] = getCellValue(cell, sharedStrings);
    });
    return values.map((value) => value || "");
  });
}

/**
 * Returns one cell's display value.
 * @param {Element} cell
 * @param {Array<string>} sharedStrings
 * @returns {string}
 */
function getCellValue(cell, sharedStrings) {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    return [...cell.getElementsByTagName("t")].map((node) => node.textContent || "").join("").trim();
  }
  const value = cell.getElementsByTagName("v")[0]?.textContent || "";
  if (type === "s") {
    return (sharedStrings[Number(value)] || "").trim();
  }
  return value.trim();
}

/**
 * Converts rows from the fixed Excel format into question objects.
 * @param {Array<Array<string>>} rows
 * @returns {Array}
 */
function normalizeRows(rows) {
  const usefulRows = rows.filter((row) => row.some(Boolean));
  const dataRows = hasHeaderRow(usefulRows[0]) ? usefulRows.slice(1) : usefulRows;
  return dataRows.map((row) => {
    const [question, optionA, optionB, optionC, optionD, answerText] = row;
    return createQuestion(question, { A: optionA, B: optionB, C: optionC, D: optionD }, parseAnswerText(answerText));
  }).filter((question) => question.question && question.answers.length);
}

/**
 * Checks whether the first row is the expected header row.
 * @param {Array<string>} row
 * @returns {boolean}
 */
function hasHeaderRow(row = []) {
  return COLUMN_NAMES.every((name, index) => String(row[index] || "").trim() === name);
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
 * Creates a normalized question object.
 * @param {string} question
 * @param {Object} options
 * @param {Array<string>} answers
 * @returns {Object}
 */
function createQuestion(question, options, answers) {
  return {
    id: createQuestionId(),
    question: String(question || "").trim(),
    options: {
      A: String(options.A || "").trim(),
      B: String(options.B || "").trim(),
      C: String(options.C || "").trim(),
      D: String(options.D || "").trim()
    },
    answers: [...new Set(answers)].sort(),
    type: answers.length > 1 ? "multiple" : "single",
    createdAt: new Date().toISOString()
  };
}

/**
 * Converts an Excel column name into a zero-based index.
 * @param {string} columnName
 * @returns {number}
 */
function columnNameToIndex(columnName) {
  return [...columnName].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

/**
 * Reads a little-endian 16-bit unsigned integer.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {number}
 */
function readUint16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/**
 * Reads a little-endian 32-bit unsigned integer.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {number}
 */
function readUint32(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

/**
 * Decodes UTF-8 bytes into text.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}





/* Source: csvImport.js */

const CSV_COLUMN_NAMES = ["題目", "選項A", "選項B", "選項C", "選項D", "正確答案"];

/**
 * Converts CSV text into imported question objects.
 * @param {string} csvText
 * @returns {Array}
 */
function parseCsvQuestions(csvText) {
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



/* Source: ui.js */
/**
 * Finds one DOM element and throws if missing.
 * @param {string} selector
 * @param {ParentNode} parent
 * @returns {Element}
 */
function query(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element) {
    throw new Error(`找不到畫面元素：${selector}`);
  }
  return element;
}

/**
 * Switches the visible application view.
 * @param {string} viewId
 * @returns {void}
 */
function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === viewId));
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewId);
  });
}

/**
 * Sets user feedback text and state.
 * @param {Element} element
 * @param {string} text
 * @param {"success"|"error"|""} state
 * @returns {void}
 */
function setMessage(element, text, state = "") {
  element.textContent = text;
  element.classList.toggle("is-success", state === "success");
  element.classList.toggle("is-error", state === "error");
}

/**
 * Formats answers for display.
 * @param {Array<string>} answers
 * @returns {string}
 */
function formatAnswers(answers) {
  return answers?.length ? answers.join(",") : "未作答";
}

/**
 * Creates an empty-state node.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createEmptyState(text) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = text;
  return element;
}

/**
 * Removes all children from an element.
 * @param {Element} element
 * @returns {void}
 */
function clearElement(element) {
  element.replaceChildren();
}


/* Source: app.js */

let quizSession = null;
const fallbackSampleQuestions = [
  {
    question: "TCP 是什麼？",
    options: { A: "網路協定", B: "作業系統", C: "CPU", D: "記憶體" },
    answers: ["A"]
  },
  {
    question: "下列哪些屬於前端基礎技術？",
    options: { A: "HTML", B: "CSS", C: "JavaScript", D: "SQL Server" },
    answers: ["A", "B", "C"]
  },
  {
    question: "localStorage 的資料主要保存在哪裡？",
    options: { A: "使用者本機瀏覽器", B: "遠端資料庫", C: "雲端主機", D: "郵件伺服器" },
    answers: ["A"]
  }
];

const elements = {
  questionBankCount: query("#questionBankCount"),
  wrongCount: query("#wrongCount"),
  excelFileInput: query("#excelFileInput"),
  importExcelButton: query("#importExcelButton"),
  loadSampleButton: query("#loadSampleButton"),
  clearBankButton: query("#clearBankButton"),
  importMessage: query("#importMessage"),
  bankPreviewCount: query("#bankPreviewCount"),
  questionPreviewList: query("#questionPreviewList"),
  questionCountSelect: query("#questionCountSelect"),
  customCountField: query("#customCountField"),
  customQuestionCount: query("#customQuestionCount"),
  fullScoreInput: query("#fullScoreInput"),
  wrongOnlyToggle: query("#wrongOnlyToggle"),
  availableQuestionCount: query("#availableQuestionCount"),
  startQuizButton: query("#startQuizButton"),
  setupMessage: query("#setupMessage"),
  quizProgress: query("#quizProgress"),
  quizType: query("#quizType"),
  submitQuizButton: query("#submitQuizButton"),
  currentQuestionId: query("#currentQuestionId"),
  currentQuestionText: query("#currentQuestionText"),
  optionList: query("#optionList"),
  previousQuestionButton: query("#previousQuestionButton"),
  nextQuestionButton: query("#nextQuestionButton"),
  resultSummaryBadge: query("#resultSummaryBadge"),
  scoreSummary: query("#scoreSummary"),
  resultList: query("#resultList"),
  reviewWrongButton: query("#reviewWrongButton"),
  newQuizButton: query("#newQuizButton"),
  wrongBookCount: query("#wrongBookCount"),
  practiceWrongButton: query("#practiceWrongButton"),
  clearAllWrongButton: query("#clearAllWrongButton"),
  wrongBookList: query("#wrongBookList"),
  historyCount: query("#historyCount"),
  historyList: query("#historyList")
};

/**
 * Initializes the application after module loading.
 * @returns {void}
 */
function initApp() {
  const settings = getSettings();
  elements.fullScoreInput.value = settings.fullScore || 100;
  bindEvents();
  refreshAll();
}

/**
 * Registers DOM event handlers.
 * @returns {void}
 */
function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
      refreshAll();
    });
  });
  elements.importExcelButton.addEventListener("click", handleExcelImport);
  elements.loadSampleButton.addEventListener("click", handleSampleLoad);
  elements.clearBankButton.addEventListener("click", handleClearBank);
  elements.questionCountSelect.addEventListener("change", handleQuestionCountChange);
  elements.fullScoreInput.addEventListener("change", persistSettings);
  elements.startQuizButton.addEventListener("click", () => startQuiz(false));
  elements.previousQuestionButton.addEventListener("click", () => moveAndRender(-1));
  elements.nextQuestionButton.addEventListener("click", () => moveAndRender(1));
  elements.submitQuizButton.addEventListener("click", submitQuiz);
  elements.reviewWrongButton.addEventListener("click", () => {
    showView("wrongBookView");
    refreshAll();
  });
  elements.newQuizButton.addEventListener("click", () => showView("practiceSetupView"));
  elements.practiceWrongButton.addEventListener("click", () => {
    elements.wrongOnlyToggle.checked = true;
    showView("practiceSetupView");
    refreshAll();
  });
  elements.clearAllWrongButton.addEventListener("click", () => {
    clearAllWrongRecords();
    refreshAll();
  });
}

/**
 * Imports questions from a selected XLSX or CSV file.
 * @returns {Promise<void>}
 */
async function handleExcelImport() {
  const file = elements.excelFileInput.files[0];
  if (!file) {
    setMessage(elements.importMessage, "請先選擇 .xlsx 或 .csv 題庫檔案。", "error");
    return;
  }

  try {
    const questions = await parseQuestionFile(file);
    if (!questions.length) {
      setMessage(elements.importMessage, "未匯入任何題目，請確認欄位與答案格式。", "error");
      return;
    }
    appendQuestions(questions);
    setMessage(elements.importMessage, `已匯入 ${questions.length} 題。`, "success");
    refreshAll();
  } catch (error) {
    setMessage(elements.importMessage, error.message || "題庫匯入失敗。", "error");
  }
}


/**
 * Parses an imported question file by extension.
 * @param {File} file
 * @returns {Promise<Array>}
 */
async function parseQuestionFile(file) {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".csv")) {
    return parseCsvQuestions(await file.text());
  }
  if (fileName.endsWith(".xlsx")) {
    return parseExcelQuestions(await file.arrayBuffer());
  }
  throw new Error("僅支援 .xlsx 或 .csv 題庫檔案。");
}
/**
 * Loads bundled sample questions from the data folder.
 * @returns {Promise<void>}
 */
async function handleSampleLoad() {
  try {
    const response = await fetch("./data/sampleQuestions.json");
    const rows = await response.json();
    const questions = normalizeSampleQuestions(rows);
    appendQuestions(questions);
    setMessage(elements.importMessage, `已載入範例題庫 ${questions.length} 題。`, "success");
    refreshAll();
  } catch {
    const questions = normalizeSampleQuestions(fallbackSampleQuestions);
    appendQuestions(questions);
    setMessage(elements.importMessage, `已載入內建範例題庫 ${questions.length} 題。`, "success");
    refreshAll();
  }
}

/**
 * Clears all questions after confirmation.
 * @returns {void}
 */
function handleClearBank() {
  if (!confirm("確定要清空題庫？錯題紀錄仍會保留，但沒有題庫時無法練習。")) {
    return;
  }
  clearQuestions();
  refreshAll();
  setMessage(elements.importMessage, "題庫已清空。", "success");
}

/**
 * Shows or hides the custom question count input.
 * @returns {void}
 */
function handleQuestionCountChange() {
  elements.customCountField.classList.toggle("is-hidden", elements.questionCountSelect.value !== "custom");
}

/**
 * Saves score settings into localStorage.
 * @returns {void}
 */
function persistSettings() {
  saveSettings({ fullScore: Number(elements.fullScoreInput.value) || 100 });
}

/**
 * Starts a new quiz from all questions or wrong questions.
 * @param {boolean} forceWrongOnly
 * @returns {void}
 */
function startQuiz(forceWrongOnly) {
  persistSettings();
  const allQuestions = getQuestions();
  const wrongOnly = forceWrongOnly || elements.wrongOnlyToggle.checked;
  const questions = wrongOnly ? getWrongBookItems(allQuestions).map((item) => item.question) : allQuestions;
  const requestedCount = getRequestedQuestionCount();

  if (!questions.length) {
    setMessage(elements.setupMessage, wrongOnly ? "目前沒有可練習的錯題。" : "請先匯入題庫。", "error");
    return;
  }

  quizSession = createQuizSession(questions, requestedCount);
  showView("quizView");
  renderCurrentQuestion();
}

/**
 * Returns the requested quiz count.
 * @returns {number}
 */
function getRequestedQuestionCount() {
  if (elements.questionCountSelect.value === "custom") {
    return Math.max(1, Number(elements.customQuestionCount.value) || 1);
  }
  return Number(elements.questionCountSelect.value);
}

/**
 * Moves to another question and updates the view.
 * @param {number} step
 * @returns {void}
 */
function moveAndRender(step) {
  if (!quizSession) {
    return;
  }
  moveQuestion(quizSession, step);
  renderCurrentQuestion();
}

/**
 * Renders the active quiz question.
 * @returns {void}
 */
function renderCurrentQuestion() {
  const question = getCurrentQuestion(quizSession);
  if (!question) {
    return;
  }

  elements.quizProgress.textContent = `第 ${quizSession.currentIndex + 1} 題 / 共 ${quizSession.questions.length} 題`;
  elements.quizType.textContent = question.type === "multiple" ? "多選題" : "單選題";
  elements.currentQuestionId.textContent = `題號：${question.id}`;
  elements.currentQuestionText.textContent = question.question;
  elements.previousQuestionButton.disabled = quizSession.currentIndex === 0;
  elements.nextQuestionButton.disabled = quizSession.currentIndex === quizSession.questions.length - 1;
  renderOptions(question);
}

/**
 * Renders answer options for the active question.
 * @param {Object} question
 * @returns {void}
 */
function renderOptions(question) {
  clearElement(elements.optionList);
  const inputType = question.type === "multiple" ? "checkbox" : "radio";
  const savedAnswers = quizSession.answers[question.id] || [];

  Object.entries(question.options).forEach(([key, text]) => {
    const label = document.createElement("label");
    label.className = "option-item";
    const input = document.createElement("input");
    input.type = inputType;
    input.name = `question-${question.id}`;
    input.value = key;
    input.checked = savedAnswers.includes(key);
    input.addEventListener("change", () => saveCurrentAnswer(question));
    const span = document.createElement("span");
    span.textContent = `${key}. ${text}`;
    label.append(input, span);
    elements.optionList.append(label);
  });
}

/**
 * Saves the selected answers for the current question.
 * @param {Object} question
 * @returns {void}
 */
function saveCurrentAnswer(question) {
  const selectedAnswers = [...elements.optionList.querySelectorAll("input:checked")].map((input) => input.value);
  setQuestionAnswer(quizSession, question.id, selectedAnswers);
}

/**
 * Submits the quiz, scores it, and updates localStorage records.
 * @returns {void}
 */
function submitQuiz() {
  if (!quizSession || !confirm("確定要交卷？交卷後會計分並更新錯題紀錄。")) {
    return;
  }
  const fullScore = Number(elements.fullScoreInput.value) || 100;
  const result = scoreQuiz(quizSession.questions, quizSession.answers, fullScore);
  updateWrongRecords(result.details);
  addHistory({
    id: `H-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    fullScore,
    totalScore: result.totalScore,
    correctCount: result.correctCount,
    wrongCount: result.wrongCount,
    accuracy: result.accuracy,
    questionCount: quizSession.questions.length
  });
  renderResult(result);
  refreshAll();
  showView("resultView");
}

/**
 * Renders score summary and per-question review.
 * @param {Object} result
 * @returns {void}
 */
function renderResult(result) {
  elements.resultSummaryBadge.textContent = `${formatNumber(result.totalScore)} 分`;
  elements.scoreSummary.replaceChildren(
    createScoreCard("總分", `${formatNumber(result.totalScore)} / ${formatNumber(result.fullScore)}`),
    createScoreCard("答對題數", `${result.correctCount}`),
    createScoreCard("答錯題數", `${result.wrongCount}`),
    createScoreCard("正確率", `${formatNumber(result.accuracy)}%`)
  );

  clearElement(elements.resultList);
  result.details.forEach((detail, index) => {
    const item = document.createElement("article");
    item.className = `list-item ${detail.correct ? "is-correct" : "is-wrong"}`;
    const displayedCorrectAnswers = detail.correct
      ? formatAnswers(detail.correctAnswers)
      : formatOptionDescriptions(detail.question, detail.correctAnswers);
    item.innerHTML = `
      <h3>${index + 1}. ${escapeHtml(detail.question.question)}</h3>
      <p>結果：${detail.correct ? "答對" : "答錯"}</p>
      <p>我的答案：${escapeHtml(formatAnswers(detail.userAnswers))}</p>
      <p>正確答案：${escapeHtml(displayedCorrectAnswers)}</p>
    `;
    elements.resultList.append(item);
  });
}

/**
 * Formats answer letters with their option descriptions.
 * @param {Object} question
 * @param {Array<string>} answers
 * @returns {string}
 */
function formatOptionDescriptions(question, answers) {
  return answers
    .map((answer) => `${answer}. ${question.options[answer] || ""}`.trim())
    .join("；");
}

/**
 * Creates a score summary card.
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function createScoreCard(label, value) {
  const card = document.createElement("div");
  card.className = "score-card";
  card.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
  return card;
}

/**
 * Refreshes all non-quiz panels.
 * @returns {void}
 */
function refreshAll() {
  const questions = getQuestions();
  const wrongItems = getWrongBookItems(questions);
  elements.questionBankCount.textContent = `題庫 ${questions.length} 題`;
  elements.wrongCount.textContent = `錯題 ${wrongItems.length} 題`;
  elements.bankPreviewCount.textContent = `${questions.length} 題`;
  elements.availableQuestionCount.textContent = `可抽 ${questions.length} 題`;
  renderQuestionPreview(questions);
  renderWrongBook(wrongItems);
  renderHistory();
}

/**
 * Renders the full question bank preview.
 * @param {Array} questions
 * @returns {void}
 */
function renderQuestionPreview(questions) {
  clearElement(elements.questionPreviewList);
  if (!questions.length) {
    elements.questionPreviewList.append(createEmptyState("尚未匯入題庫。"));
    return;
  }
  questions.forEach((question) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h3>${escapeHtml(question.id)}. ${escapeHtml(question.question)}</h3>
      <p>A. ${escapeHtml(question.options.A)}</p>
      <p>B. ${escapeHtml(question.options.B)}</p>
      <p>C. ${escapeHtml(question.options.C)}</p>
      <p>D. ${escapeHtml(question.options.D)}</p>
      <p>答案：${escapeHtml(formatAnswers(question.answers))}｜${question.type === "multiple" ? "多選" : "單選"}</p>
    `;
    elements.questionPreviewList.append(item);
  });
}

/**
 * Renders the wrong-book list and actions.
 * @param {Array} wrongItems
 * @returns {void}
 */
function renderWrongBook(wrongItems) {
  elements.wrongBookCount.textContent = `${wrongItems.length} 題`;
  elements.practiceWrongButton.disabled = wrongItems.length === 0;
  elements.clearAllWrongButton.disabled = wrongItems.length === 0;
  clearElement(elements.wrongBookList);
  if (!wrongItems.length) {
    elements.wrongBookList.append(createEmptyState("目前沒有錯題紀錄。"));
    return;
  }

  wrongItems.forEach((item) => {
    const row = document.createElement("article");
    row.className = `list-item ${item.isImportant ? "is-highlight" : ""}`;
    row.innerHTML = `
      <h3>${escapeHtml(item.question.question)}</h3>
      <p>題號：${escapeHtml(item.questionId)}</p>
      <p>我的答案：${escapeHtml(formatAnswers(item.userAnswers))}</p>
      <p>正確答案：${escapeHtml(formatOptionDescriptions(item.question, item.correctAnswers))}</p>
      <p>錯誤次數：${item.errorCount} ${item.isImportant ? "<span class=\"focus-note\">【★★★★★ 重點提醒】</span>" : ""}</p>
    `;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "清除單題錯題紀錄";
    button.addEventListener("click", () => {
      clearWrongRecord(item.questionId);
      refreshAll();
    });
    row.append(button);
    elements.wrongBookList.append(row);
  });
}

/**
 * Renders recent quiz histories.
 * @returns {void}
 */
function renderHistory() {
  const histories = getHistories();
  elements.historyCount.textContent = `${histories.length} 次`;
  clearElement(elements.historyList);
  if (!histories.length) {
    elements.historyList.append(createEmptyState("尚無作答紀錄。"));
    return;
  }
  histories.forEach((history) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h3>${escapeHtml(new Date(history.createdAt).toLocaleString())}</h3>
      <p>題數：${history.questionCount}｜總分：${formatNumber(history.totalScore)} / ${formatNumber(history.fullScore)}</p>
      <p>答對：${history.correctCount}｜答錯：${history.wrongCount}｜正確率：${formatNumber(history.accuracy)}%</p>
    `;
    elements.historyList.append(item);
  });
}

/**
 * Formats a number for compact display.
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

/**
 * Escapes text before inserting into HTML strings.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

window.quizSystemModuleLoaded = true;
initApp();







}());

