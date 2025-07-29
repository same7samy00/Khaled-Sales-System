// --- SHARED JAVASCRIPT (shared.js) ---
console.log("shared.js: Script started.");
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --- NEW CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBtJaifspNzKeht9mOmZGvVU1IOvmnyrwQ",
  authDomain: "sheikh-of-the-arabs.firebaseapp.com",
  projectId: "sheikh-of-the-arabs",
  storageBucket: "sheikh-of-the-arabs.firebasestorage.app",
  messagingSenderId: "64212176848",
  appId: "1:64212176848:web:8a02363e1be4e706fdb3d5",
  measurementId: "G-HV2WKFZ32B"
};

const SHARED_SCANNER_SESSION_ID = "YOUR_STORE_UNIQUE_SCANNER_ID_12345"; 
const DEFAULT_PASSWORD = "010274"; 

// --- FIREBASE INITIALIZATION ---
console.log("shared.js: Initializing Firebase app with config:", firebaseConfig);
const app = initializeApp(firebaseConfig);
console.log("shared.js: Firebase app initialized.");
export const auth = getAuth(app);
export const db = getFirestore(app);
console.log("shared.js: Firestore and Auth services initialized. DB object:", db); // Added db object log

// --- GLOBAL SETTINGS & PERMISSIONS ---
export const settingsDocRef = doc(db, 'settings', 'store_config');
let currentSettings = {};
let settingsUnsubscribe = null;

export async function loadSettings() {
    console.log("shared.js: loadSettings called.");
    return new Promise((resolve) => {
        if (settingsUnsubscribe) {
            settingsUnsubscribe(); 
            console.log("shared.js: Unsubscribed from previous settings listener.");
        }

        settingsUnsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            console.log("shared.js: Settings snapshot received.");
            if (docSnap.exists()) {
                currentSettings = docSnap.data();
                console.log("shared.js: Current settings from Firestore:", currentSettings);
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
                console.log("shared.js: Settings document not found, setting defaults:", currentSettings);
            }
            updateDynamicContent();
            resolve(currentSettings);
        }, (error) => {
            console.error("shared.js: Error listening to settings:", error);
            showNotification("خطأ في تحميل الإعدادات.", "error");
            resolve(currentSettings); 
        });
    });
}

function updateDynamicContent() {
    console.log("shared.js: updateDynamicContent called.");
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
    console.log("shared.js: onAuthStateChanged triggered. User:", user);
    await loadSettings(); 

    const protectedPages = ['dashboard.html', 'inventory.html', 'add_product.html', 'pos.html', 'sales_history.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!user && protectedPages.includes(currentPage)) {
        console.log("shared.js: User not logged in on a protected page, redirecting to index.html");
        window.location.href = 'index.html';
    } else if (user && currentPage === 'index.html') {
        console.log("shared.js: User logged in on index.html, redirecting to dashboard.html");
        window.location.href = 'dashboard.html';
    }
});

// --- DYNAMIC ACTIVE TAB & LOGOUT (تنشيط التبويب في القائمة وتسجيل الخروج) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("shared.js: DOMContentLoaded triggered.");
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

// --- NOTIFICATION SYSTEM (نظام الإشعارات) ---
const notificationContainer = document.getElementById('notification-container');

export function showNotification(message, type = 'info', duration = 4000) {
    if (!notificationContainer) {
        console.warn("Notification container not found.");
        return;
    }
    console.log(`showNotification: Message: "${message}", Type: "${type}"`);

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
    if (!notificationContainer) {
        console.warn("Notification container not found for confirmation.");
        return;
    }
    console.log(`showConfirmation: Message: "${message}"`);

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
    console.log(`requestScan: Purpose: ${purpose}`);
    showNotification("جاري إرسال طلب المسح إلى الهاتف...", "info");
    try {
        await setDoc(scannerSessionDocRef, {
            status: 'scanRequested',
            purpose: purpose,
            requestedAt: new Date()
        }, { merge: true });
        console.log("requestScan: Scan request sent to Firestore.");
    } catch (error) {
        console.error("requestScan: Error requesting scan:", error);
        showNotification("فشل طلب المسح. تحقق من الاتصال.", "error");
    }
}

export function listenToScannerSession(callback) {
    console.log("listenToScannerSession: Setting up listener.");
    if (scannerUnsubscribe) {
        scannerUnsubscribe();
        console.log("listenToScannerSession: Unsubscribed from previous scanner listener.");
    }

    scannerUnsubscribe = onSnapshot(scannerSessionDocRef, async (docSnap) => {
        console.log("listenToScannerSession: Scanner session snapshot received.");
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("listenToScannerSession: Scanner data:", data);
            if (data.status === 'scanned' && data.scannedValue) {
                if (callback) {
                    callback(data.scannedValue, data.purpose);
                }
                await updateDoc(scannerSessionDocRef, {
                    status: 'readyForNextScan',
                    scannedValue: null
                });
                console.log("listenToScannerSession: Scanned value processed, status updated.");
            } else if (data.status === 'phoneReady') {
                showNotification("ماسح QR بالهاتف متصل وجاهز.", "success", 2000);
            }
        } else {
            console.log("listenToScannerSession: Scanner session document does not exist.");
        }
    }, (error) => {
        console.error("listenToScannerSession: Firestore listener error:", error);
        showNotification("خطأ في الاتصال بالماسح.", "error");
    });
}
