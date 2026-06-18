# StreamVibe — Phase 1 Setup Guide

## 📁 Folder Structure

```
streamvibe/
│
├── index.html                  ← Landing page (login/register)
│
├── css/
│   ├── global.css              ← Variables, theme, navbar, buttons, hero
│   ├── auth.css                ← Modal, form inputs, OTP boxes
│   ├── home.css                ← Video grid, cards, search, categories
│   └── profile.css             ← Profile page layout
│
├── js/
│   ├── firebase-config.js      ← ⚠️ PUT YOUR FIREBASE KEYS HERE
│   ├── theme.js                ← Dark/light theme (location + time)
│   ├── auth.js                 ← Register, login, logout
│   ├── otp.js                  ← Email OTP / Phone OTP routing
│   ├── ui-helpers.js           ← Toast, messages, plan limits
│   ├── home.js                 ← Video grid, download logic
│   └── profile.js              ← Profile data, downloads list
│
└── pages/
    ├── home.html               ← Main video browsing page
    ├── profile.html            ← User profile + downloads
    ├── plans.html              ← (Phase 4)
    ├── player.html             ← (Phase 2)
    └── calls.html              ← (Phase 7)
```

---

## 🔥 Step 1: Set Up Firebase

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `streamvibe` → Continue
3. In your project, click **"</> Web"** to add a web app
4. Copy the `firebaseConfig` object
5. Open `js/firebase-config.js` and **replace** the placeholder values

### Enable Firebase Services:
- **Authentication** → Sign-in method → Enable:
  - ✅ Email/Password
  - ✅ Phone
- **Firestore Database** → Create database → Start in **test mode**

---

## 🚀 Step 2: Run the Project

Since this is plain HTML/CSS/JS, you don't need Node.js yet.

**Option A — VS Code Live Server (recommended)**
1. Install VS Code extension: **Live Server**
2. Right-click `index.html` → **Open with Live Server**

**Option B — Python (if installed)**
```bash
cd streamvibe
python -m http.server 5500
# Then open: http://localhost:5500
```

---

## ✅ What Works in Phase 1

| Feature | Status |
|---|---|
| Landing page with hero section | ✅ |
| Dark/Light theme (time + location) | ✅ |
| Sign up (saves to Firestore) | ✅ |
| Login with email/password | ✅ |
| OTP routing (South India → email, others → phone) | ✅ |
| Password strength meter | ✅ |
| Navbar (updates after login) | ✅ |
| Home page with video grid | ✅ |
| Category + search filters | ✅ |
| Download with daily limit check | ✅ |
| Profile page with downloads list | ✅ |
| Toast notifications | ✅ |

---

## ⚠️ Important Notes

1. **OTP in demo mode**: Email OTP shows in an `alert()` for now.
   In Phase 4, we'll connect EmailJS to actually send it.

2. **Phone OTP**: Firebase Phone Auth requires a real phone number.
   In test mode, add your number to Firebase's test phone numbers list.

3. **Videos**: Using placeholder images (picsum.photos) for now.
   Real video upload comes in Phase 2.

---

## 🔜 Coming in Phase 2
- Custom HTML5 video player
- Gesture controls (tap left/right/center)
- Watch time limit enforcement (5 min / 7 min / 10 min / unlimited)
- Next video auto-play
