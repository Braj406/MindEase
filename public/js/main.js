// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- TOUR: Import the tour starting function ---
import { startAppTour } from './tour.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAV0So2hi6JjI7Yp3KS4OOyKVdESkR-W5Q",
  authDomain: "mindease-9ce4a.firebaseapp.com",
  projectId: "mindease-9ce4a",
  storageBucket: "mindease-9ce4a.firebasestorage.app",
  messagingSenderId: "641145830046",
  appId: "1:641145830046:web:b6c1c06d8a7f5e062ed98f"
};

// --- Global Variables ---
let app, db, auth, userId, canvasAppId;
let resolveCustomPrompt;
let currentCalendarDate = new Date();
let editingMemoryId = null; 
let currentEditingDate = null;
let breathingDuration = 0;
let breathingInterval, countdownInterval;
let journalEntries = [], moods = {};
let moodChartInstance = null;
const THEME_CLASSES = ['theme-default', 'theme-sunset', 'theme-serenity', 'theme-meadow', 'theme-dusk'];
// NEW: State variables for the happy memories diary
let happyMemories = [];
let currentMemoryIndex = 0;


// --- Custom Alert ---
const showCustomAlert = (message, title = 'Notification', isPrompt = false, defaultValue = '', showCancel = false) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        document.getElementById('custom-alert-title').textContent = title;
        document.getElementById('custom-alert-message').textContent = message;
        const input = document.getElementById('custom-alert-input');
        input.classList.toggle('hidden', !isPrompt);
        if (isPrompt) {
            input.value = defaultValue;
            input.placeholder = `Enter value...`;
        }
        document.getElementById('custom-alert-cancel-btn').classList.toggle('hidden', !showCancel);
        resolveCustomPrompt = resolve;
        modal.classList.add('active');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Initialization & Auth Check ---
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        // This should ideally be your actual App ID for Firestore pathing
        canvasAppId = firebaseConfig.appId || '1:641145830046:web:b6c1c06d8a7f5e062ed98f; 

        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                document.body.classList.add('journal-app-body');
                document.getElementById('loading-view').style.display = 'none';
                document.getElementById('app-wrapper').style.display = 'flex';
                initializeJournalApp();
            } else {
                // If you have a separate login page, redirect there.
                // For this example, we'll assume the user is always logged in.
                // In a real app, you'd handle this more gracefully.
                // e.g., window.location.href = 'login.html';
                console.log("User is not signed in.");
                 // For demonstration without full auth, let's mock a user ID
                userId = 'test-user';
                document.body.classList.add('journal-app-body');
                document.getElementById('loading-view').style.display = 'none';
                document.getElementById('app-wrapper').style.display = 'flex';
                initializeJournalApp();
            }
        });
    } catch (error) {
        console.error("Firebase Init Error:", error);
        document.getElementById('loading-view').innerHTML = `<p class="text-red-500">Error: Could not initialize the application. Please check the console and your Firebase configuration.</p>`;
    }
    
    // --- DOM Element Cache ---
    const dom = {
        views: document.querySelectorAll('.view'),
        navLinks: document.querySelectorAll('.nav-link'),
        addEntryBtn: document.getElementById('add-entry-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        calendarGrid: document.getElementById('calendar-grid'),
        monthYearHeader: document.getElementById('month-year-header'),
        prevMonthBtn: document.getElementById('prev-month-btn'),
        nextMonthBtn: document.getElementById('next-month-btn'),
        entryTitleInput: document.getElementById('entry-title-input'),
        entryContentEditor: document.getElementById('entry-content-editor'),
        entryImageUpload: document.getElementById('entry-image-upload'),
        entryImagePreview: document.getElementById('entry-image-preview'),
        entryImageLabel: document.getElementById('entry-image-label'),
        saveBtn: document.getElementById('save-btn'),
        deleteBtn: document.getElementById('delete-btn'),
        backBtn: document.getElementById('back-btn'),
        happyMemoryCheckbox: document.getElementById('happy-memory-checkbox'),
        moodModal: document.getElementById('mood-modal'),
        moodEmojis: document.querySelectorAll('#mood-modal .mood-emoji'),
        moodChartContainer: document.getElementById('mood-chart-container'),
        moodChart: document.getElementById('mood-chart'),
        weeklyHighDiv: document.getElementById('weekly-high'),
        weeklyLowDiv: document.getElementById('weekly-low'),
        breathingSetup: document.getElementById('breathing-setup'),
        breathingSession: document.getElementById('breathing-session'),
        breathingFeedback: document.getElementById('breathing-feedback'),
        durationBtns: document.querySelectorAll('.duration-btn'),
        customDurationBtn: document.getElementById('custom-duration-btn'),
        startBreathingBtn: document.getElementById('start-breathing-btn'),
        breathingCircle: document.getElementById('breathing-circle'),
        breathingInstruction: document.getElementById('breathing-instruction'),
        breathingTimer: document.getElementById('breathing-timer'),
        feedbackEmojis: document.querySelectorAll('.feedback-emoji'),
        customAlertOkBtn: document.getElementById('custom-alert-ok-btn'),
        customAlertCancelBtn: document.getElementById('custom-alert-cancel-btn'),
        formatButtons: document.querySelectorAll('.format-btn'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileSidebarOverlay: document.getElementById('mobile-sidebar-overlay'),
        mobileSidebarMenu: document.getElementById('mobile-sidebar-menu'),
        closeMobileMenuBtn: document.getElementById('close-mobile-menu-btn'),
        addEntryBtnMobile: document.getElementById('add-entry-btn-mobile'),
        logoutBtnMobile: document.getElementById('logout-btn-mobile'),
        toolbar: document.getElementById('toolbar'),
        happyMemoryContainer: document.getElementById('happy-memory-container'),
        settingsProfilePic: document.getElementById('settings-profile-pic'),
        sidebarProfilePic: document.getElementById('sidebar-profile-pic'),
        profilePicUpload: document.getElementById('profile-pic-upload'),
        themeSelector: document.getElementById('theme-selector'),
        themeOptions: document.querySelectorAll('.theme-option'),
        streakCount: document.getElementById('streak-count'),
        promptOfTheDaySection: document.getElementById('prompt-of-the-day-section'),
        promptOfTheDayText: document.getElementById('prompt-of-the-day-text'),
        gratitudeBtn: document.getElementById('gratitude-btn'),
        gratitudeBtnMobile: document.getElementById('gratitude-btn-mobile'),
        gratitudeModal: document.getElementById('gratitude-modal'),
        gratitudeSaveBtn: document.getElementById('gratitude-save-btn'),
        gratitudeCancelBtn: document.getElementById('gratitude-cancel-btn'),
        aiPromptBtn: document.getElementById('ai-prompt-btn'),
        analyzeEntryBtn: document.getElementById('analyze-entry-btn'),
        aiInsightsContainer: document.getElementById('ai-insights-container'),
        aiSentiment: document.getElementById('ai-sentiment'),
        aiSummary: document.getElementById('ai-summary'),
        analyzePatternsBtn: document.getElementById('analyze-patterns-btn'),
        patternsResultContainer: document.getElementById('patterns-result-container'),
        entrySelectionModal: document.getElementById('entry-selection-modal'),
        entrySelectionTitle: document.getElementById('entry-selection-title'),
        entrySelectionList: document.getElementById('entry-selection-list'),
        entrySelectionCancelBtn: document.getElementById('entry-selection-cancel-btn'),
        
        // NEW: Diary-specific elements
        diaryContainer: document.querySelector('.diary-container'),
        diaryNavigation: document.querySelector('.diary-navigation'),
        diaryPagesContainer: document.getElementById('diary-pages-container'),
        diaryPrevBtn: document.getElementById('diary-prev-btn'),
        diaryNextBtn: document.getElementById('diary-next-btn'),
        diaryPageCounter: document.getElementById('diary-page-counter'),
        noMemoriesMessage: document.getElementById('no-memories-message'),
    };

    // --- State and Data ---
    const moodMap = { 
        '😍': { score: 5, color: '#FFC107' }, '😊': { score: 4, color: '#4CAF50' }, 
        '😴': { score: 3, color: '#9E9E9E' }, '😢': { score: 2, color: '#2196F3' }, 
        '😠': { score: 1, color: '#F44336' }, '😌': { score: 4, color: '#4CAF50'}, 
        '🧘': { score: 5, color: '#FFC107'} 
    };
    
    // --- Main App Initialization ---
    function initializeJournalApp() {
        if (!userId) return;
        
        const journalEntriesRef = collection(db, `artifacts/${canvasAppId}/users/${userId}/journalEntries`);
        onSnapshot(journalEntriesRef, (snapshot) => {
            journalEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter and sort happy memories
            happyMemories = journalEntries
                .filter(entry => entry.isHappy)
                .sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
            
            // Re-render the diary only if the memories view is currently active
            if (document.getElementById('memories-view').classList.contains('active')) {
                renderHappyMemoriesDiary();
            }
            
            renderCalendar(currentCalendarDate);
        });
        
        const moodsRef = collection(db, `artifacts/${canvasAppId}/users/${userId}/moods`);
        onSnapshot(moodsRef, (snapshot) => {
            moods = {};
            snapshot.docs.forEach(doc => { moods[doc.id] = doc.data().moodEmoji; });
            renderCalendar(currentCalendarDate);
            if(document.getElementById('mood-tracker-view').classList.contains('active')) {
                renderMoodTracker();
            }
        });

        const settingsRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/settings`, 'userProfile');
        onSnapshot(settingsRef, (doc) => {
            let settings = {};
            let shouldStartTour = false;

            if (doc.exists()) {
                settings = doc.data();
                if (settings.tourCompleted !== true) {
                    shouldStartTour = true;
                }
            } else {
                settings = { theme: 'theme-default', streak: 0, lastEntryDate: null }; 
                shouldStartTour = true; 
            }

            applySettings(settings);
            updateStreak(settings);

            if (shouldStartTour) {
                setTimeout(() => startAppTour(db, userId, canvasAppId), 500);
            }
        });

        feather.replace();
        // setDailyPrompt(); // Assuming this is defined elsewhere or to be added
        // promptForMood(); // Assuming this is defined elsewhere or to be added
        setupEventListeners();
        showView('calendar-view');
    }
    
    // --- Helper & Core Functions ---
    const getLocalDateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    
    // --- showView (UPDATED) ---
    const showView = (viewId) => {
        const currentActiveView = document.querySelector('.view.active');
        if (currentActiveView && currentActiveView.id === 'breathing-view' && viewId !== 'breathing-view') {
            // resetBreathingSession(); // Assuming this is defined elsewhere
        }
        dom.views.forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
        dom.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === viewId);
        });
        // closeMobileSidebar(); // Assuming this is defined elsewhere
        if (viewId === 'mood-tracker-view') {
            renderMoodTracker();
            if(dom.patternsResultContainer) dom.patternsResultContainer.innerHTML = '';
            if(dom.analyzePatternsBtn) dom.analyzePatternsBtn.disabled = false;
        }
        // NEW: Trigger diary render when switching to its view
        if (viewId === 'memories-view') {
            renderHappyMemoriesDiary();
        }
    };

    // --- NEW: Diary Renderer ---
    const renderHappyMemoriesDiary = () => {
        if (!dom.diaryPagesContainer) return;

        dom.diaryPagesContainer.innerHTML = '';
        const hasMemories = happyMemories.length > 0;

        dom.diaryContainer.classList.toggle('hidden', !hasMemories);
        dom.diaryNavigation.classList.toggle('hidden', !hasMemories);
        dom.noMemoriesMessage.classList.toggle('hidden', hasMemories);

        if (!hasMemories) return;

        happyMemories.forEach((entry, index) => {
            const page = document.createElement('div');
            page.className = 'diary-page';
            page.dataset.index = index;
            const entryDate = entry.timestamp ? entry.timestamp.toDate() : new Date(entry.date);
            const formattedDate = entryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            page.innerHTML = `
                <div class="diary-left">
                    <img src="${entry.image || 'https://placehold.co/600x400/e2e8f0/4a5568?text=A+Happy+Memory'}" class="diary-image" alt="Memory Image" onerror="this.onerror=null;this.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Error';">
                    <p class="diary-date">${formattedDate}</p>
                </div>
                <div class="diary-right">
                    <h3>${entry.title || 'Untitled Memory'}</h3>
                    <div>${entry.text || ''}</div>
                </div>
            `;
            dom.diaryPagesContainer.appendChild(page);
        });

        currentMemoryIndex = 0;
        updateDiaryDisplay();
    };
    
    // --- NEW: Helper function to control diary page visibility ---
    const updateDiaryDisplay = () => {
        if (happyMemories.length === 0) return;
        document.querySelectorAll('.diary-page').forEach(page => page.classList.remove('active'));
        const currentPageElement = document.querySelector(`.diary-page[data-index='${currentMemoryIndex}']`);
        if (currentPageElement) currentPageElement.classList.add('active');
        
        dom.diaryPageCounter.textContent = `${currentMemoryIndex + 1} / ${happyMemories.length}`;
        dom.diaryPrevBtn.disabled = currentMemoryIndex === 0;
        dom.diaryNextBtn.disabled = currentMemoryIndex >= happyMemories.length - 1;
        feather.replace(); // Re-initialize icons if any are in the diary pages
    };

    // --- Event Listeners Setup (UPDATED) ---
    function setupEventListeners() {
        if(dom.logoutBtn) dom.logoutBtn.addEventListener('click', () => signOut(auth).catch(err => console.error(err)));
        if(dom.prevMonthBtn) dom.prevMonthBtn.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(currentCalendarDate); });
        if(dom.nextMonthBtn) dom.nextMonthBtn.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(currentCalendarDate); });
        
        // ... (Keep all your other original event listeners for save, delete, mood, breathing, etc.)

        dom.navLinks.forEach(link => link.addEventListener('click', (e) => { 
            e.preventDefault(); 
            showView(link.dataset.target); 
        }));

        // NEW: Diary navigation event listeners
        dom.diaryPrevBtn.addEventListener('click', () => {
            if (currentMemoryIndex > 0) {
                currentMemoryIndex--;
                updateDiaryDisplay();
            }
        });
        dom.diaryNextBtn.addEventListener('click', () => {
            if (currentMemoryIndex < happyMemories.length - 1) {
                currentMemoryIndex++;
                updateDiaryDisplay();
            }
        });
    }

    // --- Placeholder for other functions from your original file ---
    // Make sure to include the full implementations for:
    // - renderCalendar
    // - handleCalendarDayClick
    // - openEntryForEditing
    // - renderMoodTracker
    // - applySettings
    // - updateStreak
    // - And any other functions your app relies on.

    // Example of a required function that needs to be fully implemented:
    const renderCalendar = (date) => {
        if (!dom.calendarGrid) return;
        dom.calendarGrid.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        dom.monthYearHeader.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            dom.calendarGrid.innerHTML += `<div class="p-2 text-center font-semibold text-gray-600 text-sm border-b-2">${day}</div>`;
        });
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 0; i < firstDay; i++) dom.calendarGrid.innerHTML += `<div class="border-r border-b"></div>`;
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            const currentDate = new Date(year, month, i);
            currentDate.setHours(0, 0, 0, 0);
            const dateStr = getLocalDateString(currentDate);
            const isToday = currentDate.getTime() === today.getTime();
            dayDiv.className = `p-2 border-r border-b relative calendar-day transition-colors cursor-pointer hover:bg-gray-100 ${isToday ? 'bg-blue-50' : ''}`;
            dayDiv.innerHTML = `<div class="font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}">${i}</div>`;
            
            const entriesForDay = journalEntries.filter(m => m.date === dateStr);
            if (moods[dateStr]) {
                dayDiv.innerHTML += `<div class="text-2xl text-center mt-1">${moods[dateStr]}</div>`;
            }
            if (entriesForDay.length > 0) {
                dayDiv.innerHTML += `<div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500"></div>`;
            }
            // dayDiv.addEventListener('click', () => handleCalendarDayClick(currentDate, dateStr, entriesForDay));
            dom.calendarGrid.appendChild(dayDiv);
        }
    };
    
    const renderMoodTracker = () => {
        if (moodChartInstance) {
            moodChartInstance.destroy();
        }
        if (!dom.moodChart) return;

        const today = new Date();
        const last7Days = Array(7).fill(0).map((_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            return getLocalDateString(d);
        }).reverse();

        const chartData = last7Days.map(dateStr => {
            const moodEmoji = moods[dateStr];
            return moodEmoji && moodMap[moodEmoji] ? moodMap[moodEmoji].score : null;
        });

        const chartLabels = last7Days.map(dateStr => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() + 1); // Adjust for timezone display
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        moodChartInstance = new Chart(dom.moodChart, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Mood Score',
                    data: chartData,
                    fill: false,
                    borderColor: '#3b82f6',
                    tension: 0.1,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 5,
                    spanGaps: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };
    
    function applySettings(settings) {
        // Apply theme
        document.body.classList.remove(...THEME_CLASSES);
        if (settings.theme && THEME_CLASSES.includes(settings.theme)) {
            document.body.classList.add(settings.theme);
        } else {
            document.body.classList.add('theme-default');
        }
    
        // Update profile pictures
        const picUrl = settings.profilePicture || 'https://placehold.co/80x80/e2e8f0/4a5568?text=ME';
        if(dom.settingsProfilePic) dom.settingsProfilePic.src = picUrl;
        if(dom.sidebarProfilePic) dom.sidebarProfilePic.src = picUrl.replace('80x80', '40x40'); // smaller version for sidebar
    }
    
    function updateStreak(settings) {
        if(dom.streakCount) dom.streakCount.textContent = settings.streak || 0;
    }

});
