// --- SHARED JAVASCRIPT (shared.js) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
// تم تحديث هذا السطر لاستيراد GoogleAuthProvider و signInWithPopup
import { getAuth, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي:
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// --- CONFIG (MUST BE IDENTICAL EVERYWHERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyC9eufzO00_JtbdVoDrw-bJfF1PY3meYoE",
    authDomain: "new2025-d2fba.firebaseapp.com",
    projectId: "new2025-d2fba",
    storageBucket: "new2025-d2fba.firebasestorage.app",
    messagingSenderId: "239931222059",
    appId: "1:239931222059:web:6275e5aa6577fb14f4e26e",
    measurementId: "G-3F4TJ0K34J"
};
const SHARED_SCANNER_SESSION_ID = "YOUR_STORE_UNIQUE_SCANNER_ID_12345";
const DEFAULT_PASSWORD = "010274";

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي وتهيئته:
const analytics = getAnalytics(app);

// --- GLOBAL SETTINGS & PERMISSIONS ---
export const settingsDocRef = doc(db, 'settings', 'store_config');
let currentSettings = {};
let settingsUnsubscribe = null;

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
            // تم إصلاح: استخدام showNotification المصدرة
            showNotification("خطأ في تحميل الإعدادات.", "error");
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

loadSettings();

export function getSettings() {
    return currentSettings;
}

export function canAddProducts() { return currentSettings.features?.canAddProducts ?? true; }
export function canEditProducts() { return currentSettings.features?.canEditProducts ?? true; }
export function canDeleteProducts() { return currentSettings.features?.canDeleteProducts ?? true; }
export function canAccessSalesHistory() { return currentSettings.features?.canAccessSalesHistory ?? true; }
export function canDeleteSales() { return currentSettings.features?.canDeleteSales ?? true; }
export function canAccessSettings() { return currentSettings.features?.canAccessSettings ?? true; }


// --- AUTHENTICATION (المصادقة) ---
onAuthStateChanged(auth, async (user) => {
    await loadSettings();

    const protectedPages = ['dashboard.html', 'inventory.html', 'add_product.html', 'pos.html', 'sales_history.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!user && protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
    } else if (user && currentPage === 'index.html') {
        window.location.href = 'dashboard.html';
    }
});

// --- DYNAMIC ACTIVE TAB & LOGOUT (تنشيط التبويب في القائمة وتسجيل الخروج) ---
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
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            // تم إصلاح: استخدام showConfirmation المصدرة
            showConfirmation("هل أنت متأكد من تسجيل الخروج؟", async () => {
                await signOut(auth);
                // تم إصلاح: استخدام showNotification المصدرة
                showNotification("تم تسجيل الخروج بنجاح.", "info");
                window.location.href = 'index.html';
            });
        });
    }
});

// --- NOTIFICATION SYSTEM (نظام الإشعارات) ---
const notificationContainer = document.getElementById('notification-container');

// تم إصلاح: إضافة export
export function showNotification(message, type = 'info', duration = 4000) {
    if (!notificationContainer) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    let iconClass = 'ri-information-line';

    if (type === 'success') iconClass = 'ri-check-line';
    else if (type === 'error') iconClass = 'ri-error-warning-line';
    else if (type === 'warning') iconClass = 'ri-alert-line';

    notificationDiv.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    notificationContainer.appendChild(notificationDiv);

    setTimeout(() => {
        notificationDiv.style.animation = 'fadeOut 0.5s forwards';
        notificationDiv.addEventListener('animationend', () => notificationDiv.remove());
    }, duration);
}

// تم إصلاح: إضافة export
export function showConfirmation(message, onConfirm) {
    if (!notificationContainer) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification warning confirm';
    notificationDiv.innerHTML = `
        <div><i class="ri-question-line"></i><span>${message}</span></div>
        <div class="confirm-buttons">
            <button class="btn btn-primary confirm-yes">نعم</button>
            <button class="btn btn-secondary confirm-cancel">إلغاء</button>
        </div>
    `;
    notificationContainer.appendChild(notificationDiv);

    const removeNotification = () => {
        notificationDiv.style.animation = 'fadeOut 0.5s forwards';
        notificationDiv.addEventListener('animationend', () => notificationDiv.remove());
    };

    notificationDiv.querySelector('.confirm-yes').addEventListener('click', () => {
        onConfirm();
        removeNotification();
    });
    notificationDiv.querySelector('.confirm-cancel').addEventListener('click', removeNotification);
}

// --- QR SCANNER COMMUNICATION (التواصل مع ماسح QR) ---
const scannerSessionDocRef = doc(db, 'scannerSessions', SHARED_SCANNER_SESSION_ID);
let scannerUnsubscribe = null;

export async function requestScan(purpose) {
    // تم إصلاح: استخدام showNotification المصدرة
    showNotification("جاري إرسال طلب المسح إلى الهاتف...", "info");
    try {
        await setDoc(scannerSessionDocRef, {
            status: 'scanRequested',
            purpose: purpose,
            requestedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error("Error requesting scan:", error);
        // تم إصلاح: استخدام showNotification المصدرة
        showNotification("فشل طلب المسح. تحقق من الاتصال.", "error");
    }
}

export function listenToScannerSession(callback) {
    if (scannerUnsubscribe) scannerUnsubscribe();

    scannerUnsubscribe = onSnapshot(scannerSessionDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'scanned' && data.scannedValue) {
                if (callback) {
                    callback(data.scannedValue, data.purpose);
                }
                await updateDoc(scannerSessionDocRef, {
                    status: 'readyForNextScan',
                    scannedValue: null
                });
            } else if (data.status === 'phoneReady') {
                // تم إصلاح: استخدام showNotification المصدرة
                showNotification("ماسح QR بالهاتف متصل وجاهز.", "success", 2000);
            }
        }
    }, (error) => {
        console.error("Error listening to scanner session:", error);
        // تم إصلاح: استخدام showNotification المصدرة
        showNotification("خطأ في الاتصال بالماسح.", "error");
    });
}
