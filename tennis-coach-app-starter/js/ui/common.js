function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatKeyLabel(value) {
  if (!value) return "-";

  return value
    .toString()
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function renderEmptyState({ title, message, hint = "", actionLabel = "" } = {}) {
  return `
    <div class="empty-state">
      <p class="eyebrow">V1 state</p>
      <h4>${escapeHtml(title || "Nothing to show yet")}</h4>
      <p>${escapeHtml(message || "No data is currently available.")}</p>
      ${hint ? `<p class="muted">${escapeHtml(hint)}</p>` : ""}
      ${actionLabel ? `<p class="empty-state-action"><strong>Next step:</strong> ${escapeHtml(actionLabel)}</p>` : ""}
    </div>
  `;
}

export function renderNotice({ tone = "info", title = "", message = "" } = {}) {
  return `
    <div class="notice notice-${escapeHtml(tone)}" role="status">
      ${title ? `<p><strong>${escapeHtml(title)}</strong></p>` : ""}
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

export function renderTagList(items = [], className = "") {
  if (!items.length) {
    return `<p class="muted">-</p>`;
  }

  return `
    <div class="tag-list ${className}">
      ${items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

export function splitSentences(text = "") {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
