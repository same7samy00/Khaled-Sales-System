// --- SHARED JAVASCRIPT (shared.js) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي:
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

// --- CONFIG (MUST BE IDENTICAL EVERYWHERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyCSelDJkplc5cBu45VdoV9sSMpwnBVTW9Q",
    authDomain: "khaled-sales-system.firebaseapp.com",
    projectId: "khaled-sales-system",
    storageBucket: "khaled-sales-system.firebasestorage.app",
    messagingSenderId: "911673729951",
    appId: "1:911673729951:web:14df6ecb4c1fbb3036d3aa",
    measurementId: "G-SKBYMQV82T"
};
const SHARED_SCANNER_SESSION_ID = "YOUR_STORE_UNIQUE_SCANNER_ID_12345"; // حافظ على هذا المعرف فريداً لمتجرك
const DEFAULT_PASSWORD = "010274"; // كلمة المرور الافتراضية الموحدة

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // تهيئة خدمة المصادقة
export const db = getFirestore(app); // تهيئة خدمة قاعدة البيانات Firestore
// إذا كنت تستخدم Analytics، قم بإلغاء تعليق السطر التالي وتهيئته:
// const analytics = getAnalytics(app); 

// --- GLOBAL SETTINGS & PERMISSIONS ---
// مرجع المستند الخاص بالإعدادات في Firestore
export const settingsDocRef = doc(db, 'settings', 'store_config');
let currentSettings = {}; // لتخزين الإعدادات الحالية بعد جلبها من Firestore
let settingsUnsubscribe = null; // للاشتراك في تحديثات الإعدادات في الوقت الفعلي

/**
 * يقوم بتحميل الإعدادات من Firestore أو يقوم بإنشاء إعدادات افتراضية إذا لم تكن موجودة.
 * يتم الاشتراك في تحديثات الإعدادات في الوقت الفعلي.
 * @returns {Promise<Object>} وعد بالإعدادات المحملة.
 */
export async function loadSettings() {
    return new Promise((resolve) => {
        // إذا كان هناك اشتراك سابق، قم بإلغائه لتجنب الاشتراكات المتعددة
        if (settingsUnsubscribe) settingsUnsubscribe(); 

        // الاشتراك في تحديثات مستند الإعدادات في الوقت الفعلي
        settingsUnsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // إذا كان المستند موجوداً، قم بتحميل بياناته
                currentSettings = docSnap.data();
            } else {
                // إذا لم يكن المستند موجوداً، قم بتعيين إعدادات افتراضية
                currentSettings = {
                    storeName: "شيخ العرب",
                    invoiceAddress: "عنوان المتجر",
                    invoicePhone: "رقم الهاتف",
                    invoiceThankYou: "شكراً لتسوقكم من شيخ العرب!",
                    salesHistoryPassword: DEFAULT_PASSWORD, // كلمة المرور الافتراضية لسجل المبيعات
                    settingsPassword: DEFAULT_PASSWORD,     // كلمة المرور الافتراضية للإعدادات
                    features: { // صلاحيات الميزات الافتراضية
                        canAddProducts: true,
                        canEditProducts: true,
                        canDeleteProducts: true,
                        canAccessSalesHistory: true, 
                        canDeleteSales: true,
                        canAccessSettings: true 
                    }
                };
                // محاولة حفظ الإعدادات الافتراضية في Firestore
                setDoc(settingsDocRef, currentSettings, { merge: true }).catch(e => console.error("Error setting default settings:", e));
            }
            // تحديث المحتوى الديناميكي في الواجهة بناءً على الإعدادات
            updateDynamicContent();
            // حل الوعد بالإعدادات المحملة/الافتراضية
            resolve(currentSettings);
        }, (error) => {
            // التعامل مع الأخطاء أثناء الاستماع لتحديثات الإعدادات
            console.error("Error listening to settings:", error);
            showNotification("خطأ في تحميل الإعدادات.", "error");
            // حل الوعد حتى في حالة الخطأ، باستخدام آخر إعدادات معروفة أو فارغة
            resolve(currentSettings); 
        });
    });
}

/**
 * تقوم بتحديث المحتوى الديناميكي في الواجهة (مثل اسم الشعار) بناءً على الإعدادات الحالية.
 */
function updateDynamicContent() {
    const logoElement = document.getElementById('storeLogo');
    if (logoElement && currentSettings.storeName) {
        // تقسيم اسم المتجر لعرضه بشكل مميز في الشعار
        const parts = currentSettings.storeName.split(' ');
        if (parts.length > 1) {
            logoElement.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
        } else {
            logoElement.innerHTML = `${currentSettings.storeName}`;
        }
    }
}

// تحميل الإعدادات عند بدء تشغيل shared.js
loadSettings();

/**
 * يرجع الإعدادات الحالية للنظام.
 * @returns {Object} كائن يحتوي على الإعدادات الحالية.
 */
export function getSettings() {
    return currentSettings;
}

// دوال التحقق من صلاحيات الميزات
export function canAddProducts() { return currentSettings.features?.canAddProducts ?? true; }
export function canEditProducts() { return currentSettings.features?.canEditProducts ?? true; }
export function canDeleteProducts() { return currentSettings.features?.canDeleteProducts ?? true; }
export function canAccessSalesHistory() { return currentSettings.features?.canAccessSalesHistory ?? true; }
export function canDeleteSales() { return currentSettings.features?.canDeleteSales ?? true; }
export function canAccessSettings() { return currentSettings.features?.canAccessSettings ?? true; }


// --- AUTHENTICATION (المصادقة) ---
// يتم تشغيل هذه الدالة في كل مرة تتغير فيها حالة مصادقة المستخدم (تسجيل دخول/تسجيل خروج)
onAuthStateChanged(auth, async (user) => {
    // الانتظار حتى يتم تحميل الإعدادات قبل التحقق من الصفحات المحمية
    await loadSettings(); 

    const protectedPages = ['dashboard.html', 'inventory.html', 'add_product.html', 'pos.html', 'sales_history.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!user && protectedPages.includes(currentPage)) {
        // إذا لم يكن هناك مستخدم مسجل دخول وحاول الوصول لصفحة محمية، أعد توجيهه لصفحة تسجيل الدخول
        window.location.href = 'index.html';
    } else if (user && currentPage === 'index.html') {
        // إذا كان هناك مستخدم مسجل دخول وحاول الوصول لصفحة تسجيل الدخول، أعد توجيهه للوحة التحكم
        window.location.href = 'dashboard.html';
    }
});

// --- DYNAMIC ACTIVE TAB & LOGOUT (تنشيط التبويب في القائمة وتسجيل الخروج) ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.split('/').pop();
    // تلوين التبويب النشط في القائمة الجانبية
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // التعامل مع زر تسجيل الخروج
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            showConfirmation("هل أنت متأكد من تسجيل الخروج؟", async () => {
                await signOut(auth); // تنفيذ عملية تسجيل الخروج من Firebase
                showNotification("تم تسجيل الخروج بنجاح.", "info");
                window.location.href = 'index.html'; // التوجيه لصفحة تسجيل الدخول
            });
        });
    }
});

// --- NOTIFICATION SYSTEM (نظام الإشعارات) ---
// حاوية الإشعارات في الواجهة
const notificationContainer = document.getElementById('notification-container');

/**
 * يعرض إشعاراً في الواجهة.
 * @param {string} message - رسالة الإشعار.
 * @param {'info' | 'success' | 'error' | 'warning'} [type='info'] - نوع الإشعار لتحديد اللون والأيقونة.
 * @param {number} [duration=4000] - مدة عرض الإشعار بالمللي ثانية.
 */
export function showNotification(message, type = 'info', duration = 4000) {
    // لا تفعل شيئاً إذا لم تكن هناك حاوية إشعارات
    if (!notificationContainer) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`; // إضافة فئات CSS للتصميم
    let iconClass = 'ri-information-line'; // أيقونة افتراضية

    // تحديد الأيقونة بناءً على نوع الإشعار
    if (type === 'success') iconClass = 'ri-check-line';
    else if (type === 'error') iconClass = 'ri-error-warning-line';
    else if (type === 'warning') iconClass = 'ri-alert-line';

    notificationDiv.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    notificationContainer.appendChild(notificationDiv); // إضافة الإشعار إلى الحاوية

    // إزالة الإشعار بعد مدة محددة مع تأثير تلاشي
    setTimeout(() => {
        notificationDiv.style.animation = 'fadeOut 0.5s forwards';
        notificationDiv.addEventListener('animationend', () => notificationDiv.remove());
    }, duration);
}

/**
 * يعرض إشعار تأكيد مع خياري "نعم" و "إلغاء".
 * @param {string} message - رسالة التأكيد.
 * @param {Function} onConfirm - الدالة التي سيتم تنفيذها عند تأكيد المستخدم.
 */
export function showConfirmation(message, onConfirm) {
    if (!notificationContainer) return;

    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification warning confirm'; // تصميم خاص للتأكيد
    notificationDiv.innerHTML = `
        <div><i class="ri-question-line"></i><span>${message}</span></div>
        <div class="confirm-buttons">
            <button class="btn btn-primary confirm-yes">نعم</button>
            <button class="btn btn-secondary confirm-cancel">إلغاء</button>
        </div>
    `;
    notificationContainer.appendChild(notificationDiv);

    // دالة لإزالة إشعار التأكيد
    const removeNotification = () => {
        notificationDiv.style.animation = 'fadeOut 0.5s forwards';
        notificationDiv.addEventListener('animationend', () => notificationDiv.remove());
    };

    // الاستماع لأحداث النقر على أزرار التأكيد/الإلغاء
    notificationDiv.querySelector('.confirm-yes').addEventListener('click', () => {
        onConfirm(); // تنفيذ دالة التأكيد
        removeNotification();
    });
    notificationDiv.querySelector('.confirm-cancel').addEventListener('click', removeNotification);
}

// --- QR SCANNER COMMUNICATION (التواصل مع ماسح QR) ---
// مرجع المستند الخاص بجلسة الماسح في Firestore
const scannerSessionDocRef = doc(db, 'scannerSessions', SHARED_SCANNER_SESSION_ID);
let scannerUnsubscribe = null; // للاشتراك في تحديثات جلسة الماسح

/**
 * يرسل طلباً إلى تطبيق الماسح الضوئي على الهاتف لبدء عملية المسح.
 * @param {'search' | 'add_new' | 'pos_scan'} purpose - الغرض من عملية المسح.
 */
export async function requestScan(purpose) {
    showNotification("جاري إرسال طلب المسح إلى الهاتف...", "info");
    try {
        // تحديث حالة مستند جلسة الماسح لطلب المسح
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

/**
 * يستمع إلى تحديثات جلسة الماسح من الهاتف ويقوم بتشغيل دالة رد الاتصال عند استلام قيمة ممسوحة.
 * @param {Function} callback - الدالة التي سيتم تشغيلها عند استلام قيمة ممسوحة (scannedValue, purpose).
 */
export function listenToScannerSession(callback) {
    // إلغاء الاشتراك السابق إذا كان موجوداً
    if (scannerUnsubscribe) scannerUnsubscribe();

    // الاشتراك في تحديثات مستند جلسة الماسح
    scannerUnsubscribe = onSnapshot(scannerSessionDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // إذا كانت الحالة "scanned" و توجد قيمة ممسوحة
            if (data.status === 'scanned' && data.scannedValue) {
                if (callback) {
                    callback(data.scannedValue, data.purpose); // تشغيل دالة رد الاتصال
                }
                // إعادة تعيين الحالة لكي يعلم الهاتف أن قيمة المسح قد تم استلامها
                await updateDoc(scannerSessionDocRef, {
                    status: 'readyForNextScan',
                    scannedValue: null // مسح القيمة الممسوحة
                });
            } else if (data.status === 'phoneReady') {
                // إشعار بأن الماسح متصل وجاهز
                showNotification("ماسح QR بالهاتف متصل وجاهز.", "success", 2000);
            }
        }
    }, (error) => {
        // التعامل مع أخطاء الاستماع لجلسة الماسح
        console.error("Error listening to scanner session:", error);
        showNotification("خطأ في الاتصال بالماسح.", "error");
    });
}
