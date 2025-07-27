// --- SHARED JAVASCRIPT (shared.js) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- CONFIG (MUST BE IDENTICAL EVERYWHERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyC5ls-rPdJ65x5BoMGwAOpdcPtD585C2ys",
    authDomain: "pharmacy-inventory-bf04a.firebaseapp.com",
    projectId: "pharmacy-inventory-bf04a",
    storageBucket: "pharmacy-inventory-bf04a.firebasestorage.app",
    messagingSenderId: "937788650384",
    appId: "1:937788650384:web:6451225d00e648f3a0b915",
    measurementId: "G-ZGC9EQ55SL"
};
const SHARED_SCANNER_SESSION_ID = "YOUR_STORE_UNIQUE_SCANNER_ID_12345"; // Keep this unique for your store
const DEFAULT_PASSWORD = "010274"; // Unified default password

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- GLOBAL SETTINGS & PERMISSIONS ---
export const settingsDocRef = doc(db, 'settings', 'store_config');
let currentSettings = {};
let settingsUnsubscribe = null;

export async function loadSettings() {
    return new Promise((resolve) => {
        if (settingsUnsubscribe) settingsUnsubscribe(); // Unsubscribe from previous listener

        settingsUnsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                currentSettings = docSnap.data();
            } else {
                // Default settings if none exist
                currentSettings = {
                    storeName: "شيخ العرب",
                    invoiceAddress: "عنوان المتجر",
                    invoicePhone: "رقم الهاتف",
                    invoiceThankYou: "شكراً لتسوقكم من شيخ العرب!",
                    salesHistoryPassword: DEFAULT_PASSWORD, // Unified password
                    settingsPassword: DEFAULT_PASSWORD, // Unified password
                    features: {
                        canAddProducts: true,
                        canEditProducts: true,
                        canDeleteProducts: true,
                        canAccessSalesHistory: true, // New feature toggle
                        canDeleteSales: true,
                        canAccessSettings: true // New feature toggle
                    }
                };
                setDoc(settingsDocRef, currentSettings, { merge: true }).catch(e => console.error("Error setting default settings:", e));
            }
            updateDynamicContent();
            resolve(currentSettings);
        }, (error) => {
            console.error("Error listening to settings:", error);
            showNotification("خطأ في تحميل الإعدادات.", "error");
            resolve(currentSettings); // Resolve even on error with default/last known settings
        });
    });
}

function updateDynamicContent() {
    const logoElement = document.getElementById('storeLogo');
    if (logoElement && currentSettings.storeName) {
        // Splitting logic for logo with span
        const parts = currentSettings.storeName.split(' ');
        if (parts.length > 1) {
            logoElement.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
        } else {
            logoElement.innerHTML = `${currentSettings.storeName}`;
        }
    }
}

// Initial load of settings
loadSettings();

// Helper to get current settings
export function getSettings() {
    return currentSettings;
}

// Permission checks
export function canAddProducts() { return currentSettings.features?.canAddProducts ?? true; }
export function canEditProducts() { return currentSettings.features?.canEditProducts ?? true; }
export function canDeleteProducts() { return currentSettings.features?.canDeleteProducts ?? true; }
export function canAccessSalesHistory() { return currentSettings.features?.canAccessSalesHistory ?? true; }
export function canDeleteSales() { return currentSettings.features?.canDeleteSales ?? true; }
export function canAccessSettings() { return currentSettings.features?.canAccessSettings ?? true; }


// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    // Wait for settings to load before checking protected pages
    await loadSettings(); 

    const protectedPages = ['dashboard.html', 'inventory.html', 'add_product.html', 'pos.html', 'sales_history.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!user && protectedPages.includes(currentPage)) {
        window.location.href = 'index.html';
    } else if (user && currentPage === 'index.html') {
        // If logged in, redirect away from login page
        window.location.href = 'dashboard.html';
    }
});

// --- DYNAMIC ACTIVE TAB & LOGOUT ---
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
            showConfirmation("هل أنت متأكد من تسجيل الخروج؟", async () => {
                await signOut(auth);
                showNotification("تم تسجيل الخروج بنجاح.", "info");
                window.location.href = 'index.html';
            });
        });
    }
});

// --- NOTIFICATION SYSTEM ---
const notificationContainer = document.getElementById('notification-container');
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

// --- QR SCANNER COMMUNICATION ---
const scannerSessionDocRef = doc(db, 'scannerSessions', SHARED_SCANNER_SESSION_ID);
let scannerUnsubscribe = null;

export async function requestScan(purpose) {
    showNotification("جاري إرسال طلب المسح إلى الهاتف...", "info");
    try {
        await setDoc(scannerSessionDocRef, {
            status: 'scanRequested',
            purpose: purpose,
            requestedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error("Error requesting scan:", error);
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
                // Reset the status so the phone knows the desktop received it
                await updateDoc(scannerSessionDocRef, {
                    status: 'readyForNextScan',
                    scannedValue: null
                });
            } else if (data.status === 'phoneReady') {
                showNotification("ماسح QR بالهاتف متصل وجاهز.", "success", 2000);
            }
        }
    }, (error) => {
        console.error("Error listening to scanner session:", error);
        showNotification("خطأ في الاتصال بالماسح.", "error");
    });
}
