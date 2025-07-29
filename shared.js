// 🔁 shared.js بدون تسجيل الدخول (تم تعطيل الحماية بناءً على طلب المستخدم)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// ✅ إعدادات Firebase الجديدة لمشروع new2025-d2fba
const firebaseConfig = {
  apiKey: "AIzaSyC9eufzO00_JtbdVoDrw-bJfF1PY3meYoE",
  authDomain: "new2025-d2fba.firebaseapp.com",
  projectId: "new2025-d2fba",
  storageBucket: "new2025-d2fba.firebasestorage.app",
  messagingSenderId: "239931222059",
  appId: "1:239931222059:web:6275e5aa6577fb14f4e26e",
  measurementId: "G-3F4TJ0K34J"
};

// 🔌 التهيئة
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// 🛡️ إعدادات افتراضية
export const settingsDocRef = doc(db, 'settings', 'store_config');
let currentSettings = {};
let settingsUnsubscribe = null;
const DEFAULT_PASSWORD = "010274";

export async function loadSettings() {
  return new Promise((resolve) => {
    if (settingsUnsubscribe) settingsUnsubscribe();

    settingsUnsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        currentSettings = docSnap.data();
      } else {
        currentSettings = {
          storeName: "شيخ العرب",
          invoiceAddress: "عنوان المتجر",
          invoicePhone: "رقم الهاتف",
          invoiceThankYou: "شكراً لتسوقكم من شيخ العرب!",
          salesHistoryPassword: DEFAULT_PASSWORD,
          settingsPassword: DEFAULT_PASSWORD,
          features: {
            canAddProducts: true,
            canEditProducts: true,
            canDeleteProducts: true,
            canAccessSalesHistory: true,
            canDeleteSales: true,
            canAccessSettings: true
          }
        };
        setDoc(settingsDocRef, currentSettings, { merge: true }).catch(e => console.error("Error setting default settings:", e));
      }
      updateDynamicContent();
      resolve(currentSettings);
    }, (error) => {
      console.error("Error listening to settings:", error);
      resolve(currentSettings);
    });
  });
}

function updateDynamicContent() {
  const logoElement = document.getElementById('storeLogo');
  if (logoElement && currentSettings.storeName) {
    const parts = currentSettings.storeName.split(' ');
    if (parts.length > 1) {
      logoElement.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
    } else {
      logoElement.innerHTML = `${currentSettings.storeName}`;
    }
  }
}

export function showNotification(message, type = "info", duration = 3000) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `<i class="ri-information-line"></i><span>${message}</span>`;
  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s forwards";
    notification.addEventListener("animationend", () => notification.remove());
  }, duration);
}

loadSettings();

export function getSettings() { return currentSettings; }
export function canAddProducts() { return currentSettings.features?.canAddProducts ?? true; }
export function canEditProducts() { return currentSettings.features?.canEditProducts ?? true; }
export function canDeleteProducts() { return currentSettings.features?.canDeleteProducts ?? true; }
export function canAccessSalesHistory() { return currentSettings.features?.canAccessSalesHistory ?? true; }
export function canDeleteSales() { return currentSettings.features?.canDeleteSales ?? true; }
export function canAccessSettings() { return currentSettings.features?.canAccessSettings ?? true; }

// ✅ تم تعطيل حماية الصفحات بناءً على رغبة المستخدم (لا يوجد تسجيل دخول)

// ✅ تفعيل التبويب الحالي وزر تسجيل الخروج بعد التحميل
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        window.location.href = 'index.html';
      });
    }
  });
}
