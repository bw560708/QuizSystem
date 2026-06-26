const COLUMN_NAMES = ["題目", "選項A", "選項B", "選項C", "選項D", "正確答案"];
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

/**
 * Converts an ArrayBuffer into imported question objects.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Array>}
 */
export async function parseExcelQuestions(buffer) {
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
export function normalizeSampleQuestions(rows) {
  return rows.map((row) => createQuestion(row.question, row.options, row.answers));
}

/**
 * Generates a unique question ID.
 * @returns {string}
 */
export function createQuestionId() {
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
export function createQuestion(question, options, answers) {
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



