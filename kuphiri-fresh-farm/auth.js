import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2A0i9tm7sdevanXmJAy7yO6v5InRTWDQ",
  authDomain: "kuphiri-farm-app-12345.firebaseapp.com",
  projectId: "kuphiri-farm-app-12345",
  storageBucket: "kuphiri-farm-app-12345.firebasestorage.app",
  messagingSenderId: "680152666586",
  appId: "1:680152666586:web:ba036bd6c94376fd9870e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById('auth-section');
const loginBtn = document.getElementById('login-btn');
const userProfile = document.getElementById('user-profile');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');
const authError = document.getElementById('auth-error');
const checkoutBtn = document.getElementById('checkout-btn');

let isLoginMode = true;

// Event Listeners for UI
loginBtn.addEventListener('click', () => {
    authModal.classList.add('active');
});

closeAuthBtn.addEventListener('click', () => {
    authModal.classList.remove('active');
    authError.textContent = '';
});

tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    authSubmitBtn.textContent = 'Login';
    authError.textContent = '';
});

tabSignup.addEventListener('click', () => {
    isLoginMode = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmitBtn.textContent = 'Sign Up';
    authError.textContent = '';
});

// Authentication Logic
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    authError.textContent = '';
    authSubmitBtn.disabled = true;
    
    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        authModal.classList.remove('active');
        authForm.reset();
    } catch (error) {
        authError.textContent = getFriendlyErrorMessage(error.code);
    } finally {
        authSubmitBtn.disabled = false;
    }
});

googleSigninBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    authError.textContent = '';
    
    try {
        await signInWithPopup(auth, provider);
        authModal.classList.remove('active');
    } catch (error) {
        authError.textContent = getFriendlyErrorMessage(error.code);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error", error);
    }
});

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginBtn.style.display = 'none';
        userProfile.style.display = 'flex';
        userEmailSpan.textContent = user.displayName || user.email.split('@')[0];
        
        // Expose user to window for app.js to use
        window.currentUser = user;
        
        // If there are items in cart, enable checkout
        if (window.cartItems && window.cartItems.length > 0) {
            checkoutBtn.disabled = false;
        }
    } else {
        // User is signed out
        loginBtn.style.display = 'block';
        userProfile.style.display = 'none';
        window.currentUser = null;
        
        // Disable checkout
        checkoutBtn.disabled = true;
    }
});

function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup was closed.';
        default:
            return 'An error occurred. Please try again.';
    }
}
