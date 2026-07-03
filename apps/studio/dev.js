const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => (s || "").toString().replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const SECRET = () => STUDIO_APP_CONFIG.dev.dbSecret;

function unlock() {
  const pin = $("#pinInput").value.trim();
  if (pin !== String(STUDIO_APP_CONFIG.dev.pin)) {
    $("#pinError").style.display = "block";
    $("#pinError").textContent = "Invalid PIN.";
    return;
  }
  $("#pinScreen").style.display = "none";
  $("#devApp").hidden = false;
  loadAll();
}

$all(".dev-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    $all(".dev-tab").forEach((t) => t.classList.toggle("active", t === tab));
    $all(".dev-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tab.dataset.panel}`));
  })
);

async function loadAll() {
  await Promise.all([loadAllowlist(), loadUsers()]);
}

async function loadAllowlist() {
  const data = (await Db.get("allowlist", SECRET())) || {};
  const rows = Object.entries(data).map(([key, v]) => ({ key, ...v }));
  $("#allowlistBody").innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${esc(decodeEmailKey(r.key))}</td>
        <td>${esc(r.alias || "")}</td>
        <td>${r.addedAt ? new Date(r.addedAt).toLocaleDateString() : ""}</td>
        <td><button class="btn btn-danger" data-remove="${esc(r.key)}">Remove</button></td>
      </tr>`
    )
    .join("");
  $all("[data-remove]", $("#allowlistBody")).forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("Revoke access for this email?")) return;
      await Db.remove(`allowlist/${btn.dataset.remove}`, SECRET());
      loadAllowlist();
    })
  );
}

function decodeEmailKey(key) {
  return key.replace(/,/g, ".");
}

$("#addAllowForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#newEmail").value.trim().toLowerCase();
  const alias = $("#newAlias").value.trim() || email.split("@")[0];
  await Db.set(`allowlist/${emailKey(email)}`, SECRET(), { alias, addedAt: Date.now() });
  $("#newEmail").value = "";
  $("#newAlias").value = "";
  loadAllowlist();
});

async function loadUsers() {
  const users = (await Db.get("users", SECRET())) || {};
  const rows = Object.entries(users).map(([uid, u]) => {
    const projects = Object.keys(u.projects || {}).length;
    const cards = Object.values(u.cards || {}).reduce((sum, projectCards) => sum + Object.keys(projectCards || {}).length, 0);
    return {
      uid,
      alias: u.profile?.alias || "",
      email: u.profile?.email || "",
      projects,
      cards,
      usageBytes: u.usageBytes || 0,
      createdAt: u.profile?.createdAt,
    };
  });
  $("#usersBody").innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${esc(r.alias)}</td>
        <td>${esc(r.email)}</td>
        <td>${r.projects}</td>
        <td>${r.cards}</td>
        <td>${(r.usageBytes / 1024 / 1024).toFixed(2)}MB / ${(STUDIO_APP_CONFIG.limits.maxUserBytes / 1024 / 1024).toFixed(0)}MB</td>
        <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
      </tr>`
    )
    .join("");
}
