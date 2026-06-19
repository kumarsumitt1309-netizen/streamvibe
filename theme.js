// ================================================
// STREAMVIBE — theme.js
// PURPOSE:
//   Point 4 — Dynamic color theme based on:
//     - Login time (10 AM – 12 PM IST)
//     - User location (South India states → light theme)
//   All other cases → dark theme
// ================================================

// South Indian states we need to detect
const SOUTH_INDIA_STATES = [
  "tamil nadu", "kerala", "karnataka",
  "andhra pradesh", "telangana"
];

// Store detected state globally so auth.js can use it for OTP routing
window.userState   = null;   // e.g. "karnataka"
window.userCity    = null;   // e.g. "Bengaluru"
window.isSouthIndia = false;

// ---- Apply theme to <body> ----
function applyTheme(theme) {
  const body = document.getElementById("app-body") || document.body;
  if (theme === "light") {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
  } else {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
  }
  localStorage.setItem("sv_theme", theme);
  console.log(`🎨 Theme applied: ${theme}`);
}

// ---- Check if current IST time is between 10 AM – 12 PM ----
function isInLightTimeWindow() {
  const now    = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset  = 5.5 * 60 * 60 * 1000;
  const istTime    = new Date(now.getTime() + istOffset - (now.getTimezoneOffset() * 60000));
  const hours      = istTime.getUTCHours();
  const minutes    = istTime.getUTCMinutes();
  const totalMins  = hours * 60 + minutes;

  // 10:00 = 600 mins, 12:00 = 720 mins
  return totalMins >= 600 && totalMins < 720;
}

// ---- Reverse geocode coords → state name using free API ----
async function getStateFromCoords(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res  = await fetch(url, {
      headers: { "Accept-Language": "en" }
    });
    const data = await res.json();

    const address = data.address || {};
    const state   = (address.state || "").toLowerCase().trim();
    const city    = address.city || address.town || address.village || address.county || "Unknown";

    window.userCity  = city;
    window.userState = state;
    console.log(`📍 Detected: ${city}, ${state}`);
    return state;

  } catch (err) {
    console.warn("⚠️ Could not detect location:", err);
    return null;
  }
}

// ---- Main theme detection logic ----
async function detectAndApplyTheme() {
  // If user has no geolocation support → dark theme
  if (!navigator.geolocation) {
    applyTheme("dark");
    return;
  }

  // Ask browser for location
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const state = await getStateFromCoords(latitude, longitude);

      const inSouth    = SOUTH_INDIA_STATES.includes(state);
      const inTimeWin  = isInLightTimeWindow();

      window.isSouthIndia = inSouth;

      if (inSouth && inTimeWin) {
        applyTheme("light");
      } else {
        applyTheme("dark");
      }
    },
    (error) => {
      // User denied location or error — fall back to dark
      console.warn("📍 Location denied, using dark theme:", error.message);
      applyTheme("dark");
    },
    { timeout: 6000 }
  );
}

// ---- Run on page load ----
detectAndApplyTheme();

// ---- Also expose a manual toggle for testing ----
window.toggleTheme = function () {
  const current = localStorage.getItem("sv_theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
};
