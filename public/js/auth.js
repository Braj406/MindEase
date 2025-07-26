// Import Firebase services using the modern modular syntax
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// This public config is safe to be in client-side code.
const firebaseConfig = {
    apiKey: "AIzaSyAV0So2hi6JjI7Yp3KS4OOyKVdESkR-W5Q",
    authDomain: "mindease-9ce4a.firebaseapp.com",
    projectId: "mindease-9ce4a",
    storageBucket: "mindease-9ce4a.appspot.com",
    messagingSenderId: "641145830046",
    appId: "1:641145830046:web:b6c1c06d8a7f5e062ed98f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Animate on Scroll library
AOS.init({
    once: true,
    duration: 800,
    easing: 'ease-in-out',
});

// --- Main Script Logic ---
document.addEventListener('DOMContentLoaded', function() {
    // --- Typewriter Animation ---
    const journalContainer = document.getElementById('journal-entry');
    if (journalContainer) {
        const lines = [
            "Today felt heavier than usual. The morning was a rush, and I carried that stress with me all day.",
            "But I remembered to take a few deep breaths this afternoon. I focused on the feeling of my feet on the ground.",
            "It didn't solve everything, but it created a small pocket of calm.",
            "I'm learning that it's okay not to be okay. And that small steps are still steps forward."
        ];
        let hasStarted = false, lineIndex = 0, charIndex = 0, currentLineElement = null;
        const typingSpeed = 50, newLineDelay = 400;

        function typeWriter() {
            if (lineIndex < lines.length) {
                if (charIndex === 0) {
                    currentLineElement = document.createElement('p');
                    journalContainer.appendChild(currentLineElement);
                    const cursor = document.createElement('span');
                    cursor.className = 'blinking-cursor';
                    cursor.textContent = '|';
                    currentLineElement.appendChild(cursor);
                }
                if (charIndex < lines[lineIndex].length) {
                    const textNode = document.createTextNode(lines[lineIndex].charAt(charIndex));
                    currentLineElement.insertBefore(textNode, currentLineElement.lastChild);
                    charIndex++;
                    setTimeout(typeWriter, typingSpeed);
                } else {
                    currentLineElement.lastChild.remove();
                    lineIndex++;
                    charIndex = 0;
                    setTimeout(typeWriter, newLineDelay);
                }
            } else {
                const finalCursor = document.createElement('span');
                finalCursor.className = 'blinking-cursor';
                finalCursor.textContent = '|';
                journalContainer.appendChild(finalCursor);
            }
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasStarted) {
                    hasStarted = true;
                    setTimeout(typeWriter, 500);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(document.getElementById('app-preview'));
    }

    // --- Modal & Firebase Auth Logic ---
    const modal = document.getElementById('auth-modal');
    const openModalBtns = document.querySelectorAll('.open-modal-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const signupTab = document.getElementById('signup-tab');
    const loginTab = document.getElementById('login-tab');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const authMessage = document.getElementById('auth-message');

    const openModal = () => {
        document.body.classList.add('modal-open');
        modal.classList.remove('invisible');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }, 10);
    };

    const closeModal = () => {
        document.body.classList.remove('modal-open');
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('invisible');
            authMessage.textContent = '';
        }, 300);
    };

    openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const switchTabs = (activeTab, inactiveTab, activeForm, inactiveForm) => {
        activeTab.classList.add('border-purple-500', 'text-purple-600');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
        inactiveTab.classList.add('border-transparent', 'text-gray-500');
        inactiveTab.classList.remove('border-purple-500', 'text-purple-600');
        activeForm.classList.remove('hidden');
        inactiveForm.classList.add('hidden');
        authMessage.textContent = '';
    };

    signupTab.addEventListener('click', () => switchTabs(signupTab, loginTab, signupForm, loginForm));
    loginTab.addEventListener('click', () => switchTabs(loginTab, signupTab, loginForm, signupForm));

    const showMessage = (message, isError = false) => {
        authMessage.textContent = message;
        authMessage.className = isError ? 'text-center mb-4 font-medium text-red-500' : 'text-center mb-4 font-medium text-green-500';
    };
    
    const redirectToJournal = () => {
        setTimeout(() => {
            // Redirect to journal.html as agreed
            window.location.href = 'journal.html'; 
        }, 1500);
    };

    // Sign Up Logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage('Welcome! Your account has been created.');
            // This relies on the "Trigger Email" Firebase Extension
            await addDoc(collection(db, "mail"), {
                to: email,
                template: { name: 'welcome' },
            });
            redirectToJournal();
        } catch (error) {
            let message = "An unexpected error occurred. Please try again.";
            switch (error.code) {
                case 'auth/invalid-email': message = "Please enter a valid email address."; break;
                case 'auth/weak-password': message = "Password should be at least 6 characters."; break;
                case 'auth/email-already-in-use': message = "An account with this email already exists."; break;
            }
            showMessage(message, true);
        }
    });

    // Log In Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Welcome back! Redirecting...');
            redirectToJournal();
        } catch (error) {
            let message = "An unexpected error occurred. Please try again.";
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password': 
                case 'auth/invalid-credential':
                    message = "Incorrect email or password. Please try again."; break;
                case 'auth/invalid-email': message = "Please enter a valid email address."; break;
            }
            showMessage(message, true);
        }
    });
});
