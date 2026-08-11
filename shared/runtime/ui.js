/**
 * Shared UI primitives: modal, toast, prompt replacement.
 *
 * These are framework-agnostic DOM helpers used across apps to avoid
 * native alert()/prompt()/confirm() on touch devices.
 */

export function createModal({ title = "", body = "", actions = [] } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "arh-modal-overlay";
  overlay.innerHTML = `
    <div class="arh-modal" role="dialog" aria-modal="true">
      <h3 class="arh-modal-title">${escapeHtml(title)}</h3>
      <div class="arh-modal-body">${body}</div>
      <div class="arh-modal-actions"></div>
    </div>
  `;
  const actionsEl = overlay.querySelector(".arh-modal-actions");
  for (const action of actions) {
    const btn = document.createElement("button");
    btn.className = action.primary ? "arh-btn-primary" : "arh-btn-secondary";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      if (action.onClick) action.onClick();
      overlay.remove();
    });
    actionsEl.appendChild(btn);
  }
  document.body.appendChild(overlay);
  return overlay;
}

export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `arh-toast arh-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("arh-toast-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("arh-toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
