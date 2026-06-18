// ================================================
// STREAMVIBE — otp.js
// ================================================

let _phoneConfirmResult = null;

// ---- Called by auth.js after password verified ----
async function triggerLoginOTP(email, uid) {
  const isSouth = window.isSouthIndia;
  console.log("OTP type:", isSouth ? "EMAIL" : "PHONE/DEMO");

  if (isSouth) {
    await sendEmailOTPDemo(email, uid);
  } else {
    const phone = window._pendingPhone || "your mobile number";
    await sendPhoneOTPdemo(phone, uid);
  }
}

// ---- DEMO EMAIL OTP (works without any extra setup) ----
async function sendEmailOTPDemo(email, uid) {
  try {
    // Generate 6-digit code
    const code   = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save to Firestore
    await db.collection("otps").doc(uid).set({ code, expiry, type: "email" });

    console.log("OTP Code:", code);

    // Show OTP to user (demo mode)
    setTimeout(() => {
      alert(`Your StreamVibe OTP is: ${code}\n\n(In production this goes to your email)`);
    }, 300);

    // Reset spinner and show OTP input
    resetLoginBtn();
    showOTPSection(email);

  } catch(err) {
    console.error("OTP save error:", err);

    // Even if Firestore fails, generate a local OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    window._localOTP   = code;
    window._localOTPex = Date.now() + 10 * 60 * 1000;

    setTimeout(() => {
      alert(`Your StreamVibe OTP is: ${code}\n\n(Demo mode - stored locally)`);
    }, 300);

    resetLoginBtn();
    showOTPSection(email);
  }
}

// ---- Show OTP boxes in UI ----
function showOTPSection(email) {
  const section     = document.getElementById("login-otp-section");
  const instruction = document.getElementById("otp-instruction");
  const loginBtn    = document.getElementById("login-btn");
  const infoEl      = document.getElementById("login-info");

  // Hide info message and login button
  if (infoEl) { infoEl.textContent = ""; infoEl.className = "form-msg hidden"; }
  if (loginBtn) loginBtn.classList.add("hidden");

  // Show OTP section
  section.classList.remove("hidden");
  instruction.textContent = `Enter the 6-digit OTP shown in the popup (sent to ${maskEmail(email)})`;

  // Clear boxes and focus first
  document.querySelectorAll(".otp-box").forEach(b => b.value = "");
  setTimeout(() => {
    const first = document.querySelector(".otp-box");
    if (first) first.focus();
  }, 100);
}

// ---- Move focus between OTP boxes ----
function otpMove(input, position) {
  input.value = input.value.replace(/[^0-9]/g, "");
  if (input.value) {
    const boxes = document.querySelectorAll(".otp-box");
    if (position < boxes.length) boxes[position].focus();
  }
}

// ---- Collect all 6 digits ----
function collectOTP() {
  return Array.from(document.querySelectorAll(".otp-box"))
    .map(b => b.value).join("");
}

// ---- Verify OTP ----
async function verifyOTP() {
  const entered = collectOTP();

  if (entered.length < 6) {
    showError("login-error", "Please enter all 6 digits.");
    return;
  }

  const uid = window._pendingUID;

  try {
    // Try Firestore OTP first
    let verified = false;

    try {
      const doc = await db.collection("otps").doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        if (Date.now() > data.expiry) {
          showError("login-error", "OTP expired. Click Resend OTP.");
          return;
        }
        if (data.code === entered) {
          verified = true;
          await db.collection("otps").doc(uid).delete();
        } else {
          showError("login-error", "Incorrect OTP. Please try again.");
          return;
        }
      }
    } catch(firestoreErr) {
      console.warn("Firestore check failed, trying local OTP");
    }

    // Fallback: check locally stored OTP
    if (!verified && window._localOTP) {
      if (Date.now() > window._localOTPex) {
        showError("login-error", "OTP expired. Click Resend OTP.");
        return;
      }
      if (window._localOTP === entered) {
        verified = true;
      } else {
        showError("login-error", "Incorrect OTP. Please try again.");
        return;
      }
    }

    if (verified) {
      await completeLogin();
    } else {
      showError("login-error", "Incorrect OTP. Please try again.");
    }

  } catch (err) {
    showError("login-error", "Verification error: " + err.message);
  }
}

// ---- Complete login after OTP verified ----
async function completeLogin() {
  const email    = window._pendingEmail;
  const password = window._pendingPass;

  window._suppressAuthChange = true;

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const uid    = result.user.uid;

    // Try to update Firestore, but don't block login if it fails
    try {
      await db.collection("users").doc(uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        lastCity:  window.userCity  || "unknown",
        lastState: window.userState || "unknown",
      });
    } catch(e) {
      console.warn("Could not update lastLogin:", e);
    }

    window._suppressAuthChange = false;
    window._localOTP = null;

    showToast("Welcome back! 🎉", "success");

    // Update nav
    try {
      const doc  = await db.collection("users").doc(uid).get();
      const data = doc.exists ? doc.data() : {};
      updateNavForLoggedInUser(data);
    } catch(e) {
      updateNavForLoggedInUser({ plan: "free" });
    }

    setTimeout(() => {
      window.location.href = "pages/home.html";
    }, 800);

  } catch (err) {
    window._suppressAuthChange = false;
    showError("login-error", "Login failed: " + err.message);
  }
}

// ---- Resend OTP ----
async function resendOTP() {
  document.getElementById("login-otp-section").classList.add("hidden");
  document.getElementById("login-btn").classList.remove("hidden");
  window._localOTP = null;

  const email = window._pendingEmail;
  const uid   = window._pendingUID;
  if (!uid) return;

  await sendEmailOTPDemo(email, uid);
}

// ---- Reset login button (remove spinner) ----
function resetLoginBtn() {
  const btn = document.getElementById("login-btn");
  if (btn) {
    btn.classList.remove("loading", "hidden");
    btn.disabled = false;
  }
}

async function sendPhoneOTPdemo(phone, uid) {
  try {
    const code   = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    await db.collection("otps").doc(uid).set({ code, expiry, type: "phone" });

    console.log("Phone OTP Code:", code);

    setTimeout(() => {
      alert(`Your StreamVibe phone OTP is: ${code}\n\n(In production this goes to your mobile number.)`);
    }, 300);

    resetLoginBtn();
    showOTPSection(phone, "phone");
  } catch (err) {
    console.error("Phone OTP save error:", err);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    window._localOTP   = code;
    window._localOTPex = Date.now() + 10 * 60 * 1000;
    setTimeout(() => {
      alert(`Your StreamVibe phone OTP is: ${code}\n\n(Demo mode - shown locally)`);
    }, 300);
    resetLoginBtn();
    showOTPSection(phone, "phone");
  }
}

// ---- Show OTP boxes in UI ----
function showOTPSection(contact, type = "email") {
  const section     = document.getElementById("login-otp-section");
  const instruction = document.getElementById("otp-instruction");
  const loginBtn    = document.getElementById("login-btn");
  const infoEl      = document.getElementById("login-info");

  if (infoEl) { infoEl.textContent = ""; infoEl.className = "form-msg hidden"; }
  if (loginBtn) loginBtn.classList.add("hidden");

  section.classList.remove("hidden");
  instruction.textContent = `Enter the 6-digit OTP sent to ${maskContact(contact, type)}.`;

  document.querySelectorAll(".otp-box").forEach(b => b.value = "");
  setTimeout(() => {
    const first = document.querySelector(".otp-box");
    if (first) first.focus();
  }, 100);
}

// ---- Masking helpers ----
function maskEmail(email) {
  if (!email) return "your email";
  const [user, domain] = email.split("@");
  return user.slice(0, 3) + "***@" + domain;
}

function maskPhone(phone) {
  if (!phone) return "your phone";
  return phone.slice(0, 4) + "******" + phone.slice(-2);
}

function maskContact(value, type) {
  return type === "phone" ? maskPhone(value) : maskEmail(value);
}

// ---- Hidden reCAPTCHA container (kept for future phone auth) ----
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("recaptcha-container")) {
    const div = document.createElement("div");
    div.id    = "recaptcha-container";
    document.body.appendChild(div);
  }
});
