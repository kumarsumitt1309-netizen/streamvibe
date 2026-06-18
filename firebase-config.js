// ================================================
// STREAMVIBE — firebase-config.js
// ================================================

const firebaseConfig = {
  apiKey:            "AIzaSyAYGg7hYPSwEgplD-ugrHxx0I9vlt2W-cQ",
  authDomain:        "streamvibe-f725a.firebaseapp.com",
  projectId:         "streamvibe-f725a",
  storageBucket:     "streamvibe-f725a.firebasestorage.app",
  messagingSenderId: "44692394602",
  appId:             "1:44692394602:web:65ac11a9f02297d919b013",
  measurementId:     "G-H223CF5XB2"
};

// ---- Initialize ----
firebase.initializeApp(firebaseConfig);

// ---- Global shortcuts ----
const auth = firebase.auth();
const db   = firebase.firestore();

// ---- IMPORTANT: Disable offline persistence ----
// This fixes the "client is offline" error on localhost
db.settings({ experimentalForceLongPolling: true, merge: true });
db.disableNetwork().then(() => db.enableNetwork());

// ---- Keep user logged in across browser refresh ----
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log("✅ Firebase initialized");
