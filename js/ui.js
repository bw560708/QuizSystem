/**
 * Finds one DOM element and throws if missing.
 * @param {string} selector
 * @param {ParentNode} parent
 * @returns {Element}
 */
export function query(selector, parent = document) {
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
export function showView(viewId) {
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
export function setMessage(element, text, state = "") {
  element.textContent = text;
  element.classList.toggle("is-success", state === "success");
  element.classList.toggle("is-error", state === "error");
}

/**
 * Formats answers for display.
 * @param {Array<string>} answers
 * @returns {string}
 */
export function formatAnswers(answers) {
  return answers?.length ? answers.join(",") : "未作答";
}

/**
 * Creates an empty-state node.
 * @param {string} text
 * @returns {HTMLElement}
 */
export function createEmptyState(text) {
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
export function clearElement(element) {
  element.replaceChildren();
}
