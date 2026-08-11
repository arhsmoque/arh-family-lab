const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => (s || "").toString().replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/*
  Admin access: a real Firebase Auth sign-in (same mechanism as the main
  app), gated by the Realtime Database rules to the email in
  APP_CONFIG.dev.adminEmail — see studio.config.js and SETUP.md. There is
  no separate secret; every Db call below carries the signed-in admin's
  own idToken.
*/
const state = { session: null };
const TOKEN = () => state.session.idToken;

function isAdminEmail(email) {
  return (email || "").toLowerCase() === (APP_CONFIG.dev.adminEmail || "").toLowerCase();
}

function showSignInMessage(msg, ok = false) {
  const el = $("#pinError");
  el.style.display = "block";
  el.style.color = ok ? "#9cf0c9" : "#ffb4a8";
  el.textContent = msg;
}
const showSignInError = (msg) => showSignInMessage(msg, false);

async function enterConsole(session) {
  state.session = session;
  $("#pinScreen").style.display = "none";
  $("#devApp").hidden = false;
  await loadAll();
}

$("#adminSignInForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#adminEmail").value.trim();
  const password = $("#adminPassword").value;
  if (!isAdminEmail(email)) {
    showSignInError(`Only ${APP_CONFIG.dev.adminEmail} can open this console.`);
    return;
  }
  try {
    let session;
    try {
      session = await Auth.signIn(email, password);
    } catch (err) {
      // Firebase returns the generic INVALID_LOGIN_CREDENTIALS (not the old
      // specific EMAIL_NOT_FOUND) for both "no such account" and "wrong
      // password" now. Try creating the account; if it already exists,
      // signUp fails with EMAIL_EXISTS and we know it was really a wrong
      // password.
      const msg = err.message || "";
      if (msg.includes("EMAIL_NOT_FOUND") || msg.includes("INVALID_LOGIN_CREDENTIALS")) {
        try {
          session = await Auth.signUp(email, password);
        } catch (signUpErr) {
          if ((signUpErr.message || "").includes("EMAIL_EXISTS")) {
            throw new Error("Wrong password for this admin account.");
          }
          throw signUpErr;
        }
      } else {
        throw err;
      }
    }
    await enterConsole(session);
  } catch (err) {
    showSignInError(err.message || "Sign-in failed.");
  }
});

$("#btnForgotPassword").addEventListener("click", async () => {
  const email = $("#adminEmail").value.trim();
  if (!isAdminEmail(email)) {
    showSignInError(`Type ${APP_CONFIG.dev.adminEmail} above first, then tap "Forgot password?".`);
    return;
  }
  try {
    await Auth.sendPasswordReset(email);
    showSignInMessage("Reset email sent! Check your inbox (and spam folder).", true);
  } catch (err) {
    showSignInError(err.message || "Could not send reset email.");
  }
});

(async function boot() {
  const session = await Auth.currentSession();
  if (session && isAdminEmail(session.email)) {
    await enterConsole(session);
  }
})();

$all(".dev-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    $all(".dev-tab").forEach((t) => t.classList.toggle("active", t === tab));
    $all(".dev-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tab.dataset.panel}`));
  })
);

async function loadAll() {
  await Promise.all([loadAllowlist(), loadUsers(), loadSettings()]);
}

async function loadAllowlist() {
  const data = (await Db.get("allowlist", TOKEN())) || {};
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
      await Db.remove(`allowlist/${btn.dataset.remove}`, TOKEN());
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
  await Db.set(`allowlist/${emailKey(email)}`, TOKEN(), { alias, addedAt: Date.now() });
  $("#newEmail").value = "";
  $("#newAlias").value = "";
  loadAllowlist();
});

/*
  shallow=true lists uids without pulling any card data (photo cards hold
  big base64 blobs), then we fetch only the two small leaves we display.
*/
async function loadUsers() {
  const uids = Object.keys((await Db.shallowGet("users", TOKEN())) || {});
  const rows = await Promise.all(
    uids.map(async (uid) => {
      const [profile, usageBytes] = await Promise.all([
        Db.get(`users/${uid}/profile`, TOKEN()),
        Db.get(`users/${uid}/usageBytes`, TOKEN()),
      ]);
      return {
        uid,
        alias: profile?.alias || "",
        email: profile?.email || "",
        usageBytes: usageBytes || 0,
        createdAt: profile?.createdAt,
      };
    })
  );
  $("#usersBody").innerHTML = rows
    .map(
      (r) => `<tr>
        <td>${esc(r.alias)}</td>
        <td>${esc(r.email)}</td>
        <td>${(r.usageBytes / 1024 / 1024).toFixed(2)}MB / ${(APP_CONFIG.limits.maxUserBytes / 1024 / 1024).toFixed(0)}MB</td>
        <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
      </tr>`
    )
    .join("");
}

/* ---------------- Registration gate toggle ---------------- */
async function loadSettings() {
  const on = (await Db.get("config/registrationGate", TOKEN())) === true;
  renderGate(on);
}

function renderGate(on) {
  $("#gateState").textContent = on
    ? "Gate is CLOSED — only approved emails can sign up."
    : "Gate is OPEN — anyone can sign up.";
  const btn = $("#gateToggle");
  btn.disabled = false;
  btn.textContent = on ? "Open the gate" : "Close the gate";
  btn.onclick = async () => {
    btn.disabled = true;
    await Db.set("config/registrationGate", TOKEN(), !on);
    renderGate(!on);
  };
}
