// --- SHARED JAVASCRIPT (shared.js) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
// تم تحديث هذا السطر لاستيراد GoogleAuthProvider و signInWithPopup
import { getAuth, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي:
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js"; // UNCOMMENTED

// --- CONFIG (MUST BE IDENTICAL EVERYWHERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyC9eufzO00_JtbdVoDrw-bJfF1PY3meYoE", // UPDATED
    authDomain: "new2025-d2fba.firebaseapp.com", // UPDATED
    projectId: "new2025-d2fba", // UPDATED
    storageBucket: "new2025-d2fba.firebasestorage.app", // UPDATED
    messagingSenderId: "239931222059", // UPDATED
    appId: "1:239931222059:web:6275e5aa6577fb14f4e26e", // UPDATED
    measurementId: "G-3F4TJ0K34J" // UPDATED
};
const SHARED_SCANNER_SESSION_ID = "YOUR_STORE_UNIQUE_SCANNER_ID_12345";
const DEFAULT_PASSWORD = "010274";

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي وتهيئته:
const analytics = getAnalytics(app); // UNCOMMENTED AND INITIALIZED

// ... rest of shared.js content ...
