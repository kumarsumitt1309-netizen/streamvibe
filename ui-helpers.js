// ================================================
// STREAMVIBE — ui-helpers.js
// PURPOSE: Reusable UI utility functions used
//   across all pages (toast, messages, loading)
// ================================================

// ---- TOAST NOTIFICATION ----
let _toastTimer = null;

function showToast(message, type = "default", duration = 3000) {
  const toast = document.getElementById("toast");
  const msg   = document.getElementById("toast-msg");
  if (!toast) return;

  msg.textContent = message;
  toast.className = "toast";  // reset classes
  if (type !== "default") toast.classList.add(`toast-${type}`);
  toast.classList.remove("hidden");

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

// ---- INLINE MESSAGES ----
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = "⚠ " + message;
  el.className   = "form-msg error";
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = "✓ " + message;
  el.className   = "form-msg success";
}

function showInfo(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = "ℹ " + message;
  el.className   = "form-msg info";
}

function clearMessages() {
  const ids = [
    "login-error", "login-info",
    "reg-error",   "reg-success"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "";
      el.className   = "form-msg hidden";
    }
  });
}

// ---- LOADING BUTTON STATE ----
function setLoadingBtn(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add("loading");
    btn.disabled = true;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

// ---- FORMAT DATE ----
function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

// ---- CHECK IF USER IS LOGGED IN ----
// Returns a promise that resolves with user or null
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// ---- REDIRECT IF NOT LOGGED IN ----
// Call this at the top of protected pages
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
  }
  return user;
}

// ---- GET USER PROFILE FROM FIRESTORE ----
async function getUserProfile(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? doc.data() : null;
}

// ---- PLAN LIMITS ----
const PLAN_LIMITS = {
  free:   { watchMinutes: 5,   downloadsPerDay: 1,   label: "Free" },
  bronze: { watchMinutes: 7,   downloadsPerDay: 999, label: "Bronze" },
  silver: { watchMinutes: 10,  downloadsPerDay: 999, label: "Silver" },
  gold:   { watchMinutes: 9999,downloadsPerDay: 999, label: "Gold"   },
};

function getPlanLimit(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS["free"];
}
