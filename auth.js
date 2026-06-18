// ================================================
// STREAMVIBE — auth.js
// PURPOSE:
//   - User registration (email/password → Firestore profile)
//   - User login (email/password → then trigger OTP)
//   - Logout
//   - Password strength meter
//   - On page load: check if already logged in
// ================================================

// Prevent onAuthStateChanged from firing mid-flow
window._suppressAuthChange = false;

// ---- Show / Hide Auth Modal ----
function showAuth(tab = "login") {
  document.getElementById("auth-overlay").classList.remove("hidden");
  switchTab(tab);
}

function closeAuth(event) {
  if (event.target === document.getElementById("auth-overlay")) {
    document.getElementById("auth-overlay").classList.add("hidden");
  }
}

function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("form-login").classList.toggle("hidden", !isLogin);
  document.getElementById("form-register").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-register").classList.toggle("active", !isLogin);
  clearMessages();
}

// ---- Password visibility toggle ----
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
}

// ---- Password strength meter ----
document.addEventListener("DOMContentLoaded", () => {
  const pwInput = document.getElementById("reg-password");
  if (pwInput) {
    pwInput.addEventListener("input", () => {
      updateStrength(pwInput.value);
    });
  }
});

function updateStrength(pw) {
  const fill  = document.getElementById("strength-fill");
  const label = document.getElementById("strength-label");
  let score   = 0;

  if (pw.length >= 8)               score++;
  if (/[A-Z]/.test(pw))             score++;
  if (/[0-9]/.test(pw))             score++;
  if (/[^a-zA-Z0-9]/.test(pw))     score++;

  const levels = [
    { pct: "0%",   color: "#ff4f4f", text: "Password strength" },
    { pct: "25%",  color: "#ff4f4f", text: "Weak" },
    { pct: "50%",  color: "#f5a623", text: "Fair" },
    { pct: "75%",  color: "#4fc3f7", text: "Good" },
    { pct: "100%", color: "#22c97a", text: "Strong ✓" },
  ];

  const lvl = levels[score] || levels[0];
  fill.style.width           = lvl.pct;
  fill.style.backgroundColor = lvl.color;
  label.textContent          = lvl.text;
  label.style.color          = lvl.color;
}

// ---- REGISTER ----
async function handleRegister() {
  clearMessages();

  const fname    = document.getElementById("reg-fname").value.trim();
  const lname    = document.getElementById("reg-lname").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;

  // --- Validation ---
  if (!email)                   return showError("reg-error", "Please enter a valid email.");
  if (password.length < 8)      return showError("reg-error", "Password must be at least 8 characters.");
  if (password !== confirm)     return showError("reg-error", "Passwords do not match.");

  const btn = document.querySelector("#form-register .btn-primary");
  setLoadingBtn(btn, true);

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const uid    = result.user.uid;
    const displayName = [fname, lname].filter(Boolean).join(" ");

    if (displayName) {
      await result.user.updateProfile({ displayName });
    }

    await db.collection("users").doc(uid).set({
      uid,
      firstName:    fname || "",
      lastName:     lname || "",
      email,
      plan:         "free",
      downloads:    0,
      lastDownload: null,
      createdAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });

    showSuccess("reg-success", "Account created! Redirecting to home...");
    setTimeout(() => {
      window.location.href = "pages/home.html";
    }, 1000);

  } catch (err) {
    const msg = firebaseErrorMessage(err.code);
    showError("reg-error", msg);
  } finally {
    setLoadingBtn(btn, false);
  }
}

// ---- LOGIN ----
async function handleLogin() {
  clearMessages();

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email)    return showError("login-error", "Please enter your email.");
  if (!password) return showError("login-error", "Please enter your password.");

  const btn = document.getElementById("login-btn");
  setLoadingBtn(btn, true);

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const uid = result.user.uid;

    try {
      const doc = await db.collection("users").doc(uid).get();
      const data = doc.exists ? doc.data() : {};
      updateNavForLoggedInUser(data);
    } catch (err) {
      console.warn("Could not fetch user profile:", err);
      updateNavForLoggedInUser({ plan: "free" });
    }

    showToast("Welcome back! 🎉", "success");
    setTimeout(() => {
      window.location.href = "pages/home.html";
    }, 800);
  } catch (err) {
    showError("login-error", firebaseErrorMessage(err.code));
  } finally {
    setLoadingBtn(btn, false);
  }
}

// ---- LOGOUT ----
async function handleLogout() {
  await auth.signOut();
  window.location.reload();
}

// ---- On page load: check if user already has a session ----
auth.onAuthStateChanged(async (user) => {
  if (window._suppressAuthChange) return;

  if (user) {
    try {
      const doc  = await db.collection("users").doc(user.uid).get();
      const data = doc.exists ? doc.data() : {};
      if (data && data.plan) {
        updateNavForLoggedInUser(data);
      }
    } catch (e) {
      console.warn("Could not fetch user profile:", e);
    }
  }
});

// ---- Update navbar after login ----
function updateNavForLoggedInUser(userData) {
  const navAuth = document.getElementById("nav-auth");
  const navUser = document.getElementById("nav-user");
  if (navAuth) navAuth.classList.add("hidden");
  if (navUser) navUser.classList.remove("hidden");

  const badge = document.getElementById("user-plan-badge");
  if (badge) badge.textContent = (userData.plan || "free").toUpperCase();

  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.classList.add("hidden");
}

// ---- Human-readable Firebase errors ----
function firebaseErrorMessage(code) {
  const map = {
    "auth/email-already-in-use":   "This email is already registered. Try logging in.",
    "auth/invalid-email":          "Invalid email address.",
    "auth/weak-password":          "Password is too weak. Use at least 8 characters.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/invalid-credential":     "Incorrect email or password. Please try again.",
    "auth/too-many-requests":      "Too many attempts. Please wait a few minutes.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
