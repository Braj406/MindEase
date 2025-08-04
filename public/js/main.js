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
    storageBucket: "mindease-9ce4a.appspot.com",
    messagingSenderId: "641145830046",
    appId: "1:641145830046:web:b6c1c06d8a7f5e062ed98f"
};

// --- Global Variables (Merged) ---
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
        canvasAppId = firebaseConfig.appId;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                document.body.classList.add('journal-app-body');
                document.getElementById('loading-view').style.display = 'none';
                document.getElementById('app-wrapper').style.display = 'flex';
                initializeJournalApp();
            } else {
                window.location.href = 'index.html';
            }
        });
    } catch (error) {
        console.error("Firebase Init Error:", error);
        document.getElementById('loading-view').innerHTML = `<p class="text-red-500">Error: Could not initialize the application. Please check the console.</p>`;
    }
    
    // --- DOM Element Cache (Fully Merged) ---
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
    
    // --- Main App Initialization (MERGED) ---
    function initializeJournalApp() {
        if (!userId) return;
        
        const journalEntriesRef = collection(db, `artifacts/${canvasAppId}/users/${userId}/journalEntries`);
        onSnapshot(journalEntriesRef, (snapshot) => {
            journalEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // NEW: Filter for happy memories and sort them by date
            happyMemories = journalEntries
                .filter(entry => entry.isHappy)
                .sort((a, b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
            
            // NEW: If the memories view is active, render the new diary
            if (document.getElementById('memories-view').classList.contains('active')) {
                renderHappyMemoriesDiary();
            }
            
            // Always render the calendar
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
        setDailyPrompt();
        promptForMood();
        setupEventListeners();
        showView('calendar-view');
    }
    
    // --- Helper & Core Functions ---
    const getLocalDateString = (date) => new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    // --- showView (MERGED) ---
    const showView = (viewId) => {
        const currentActiveView = document.querySelector('.view.active');
        if (currentActiveView && currentActiveView.id === 'breathing-view' && viewId !== 'breathing-view') {
            resetBreathingSession();
        }
        dom.views.forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');
        dom.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === viewId);
            link.classList.toggle('bg-gray-100', link.dataset.target === viewId);
            link.classList.toggle('font-bold', link.dataset.target === viewId);
        });
        closeMobileSidebar();
        if (viewId === 'mood-tracker-view') {
            renderMoodTracker();
            if(dom.patternsResultContainer) dom.patternsResultContainer.innerHTML = '';
            if(dom.analyzePatternsBtn) dom.analyzePatternsBtn.disabled = false;
        }
        // NEW: Call the new diary rendering function when switching to its view
        if (viewId === 'memories-view') {
            renderHappyMemoriesDiary();
        }
    };

    // --- REPLACES the old renderMemories function ---
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
            const formattedDate = entry.date ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Someday';
            page.innerHTML = `
                <div class="diary-left">
                    <img src="${entry.image || 'https://placehold.co/600x400/e2e8f0/4a5568?text=No+Image'}" class="diary-image" alt="Memory Image" onerror="this.onerror=null;this.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Error';">
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
        feather.replace();
    };
    
    const resetBreathingSession = () => {
        clearInterval(breathingInterval);
        clearInterval(countdownInterval);
        breathingDuration = 0;
        dom.breathingSetup.style.display = 'block';
        dom.breathingSession.style.display = 'none';
        dom.breathingFeedback.style.display = 'none';
        dom.breathingCircle.classList.remove('breathe-in', 'breathe-out');
        dom.breathingInstruction.textContent = '';
        dom.breathingTimer.textContent = '';
        dom.durationBtns.forEach(b => b.classList.remove('selected-duration-btn'));
        dom.customDurationBtn.textContent = "Custom";
        dom.startBreathingBtn.disabled = true;
    };
    
    const setEntryViewState = (isEditable, isNew) => {
        dom.entryTitleInput.readOnly = !isEditable;
        dom.entryContentEditor.contentEditable = isEditable;
        dom.saveBtn.classList.toggle('hidden', !isEditable);
        dom.deleteBtn.classList.toggle('hidden', !isEditable || isNew);
        dom.toolbar.classList.toggle('hidden', !isEditable);
        dom.happyMemoryContainer.classList.toggle('hidden', !isEditable);
        dom.entryImageLabel.style.pointerEvents = isEditable ? 'auto' : 'none';
        dom.aiPromptBtn.classList.toggle('hidden', !isEditable);
        dom.analyzeEntryBtn.classList.toggle('hidden', isEditable || isNew);
        dom.backBtn.classList.remove('hidden'); 
    };
    
    const openEntryForEditing = (entry = null, isEditable = true, dateStr = null, initialContent = '') => {
        const isNew = entry === null;
        editingMemoryId = isNew ? null : entry.id;
        currentEditingDate = dateStr;
        dom.entryTitleInput.value = isNew ? '' : entry.title;
        dom.entryContentEditor.innerHTML = isNew ? initialContent : entry.text;
        dom.happyMemoryCheckbox.checked = isNew ? false : entry.isHappy;
        dom.entryImagePreview.src = entry?.image || 'https://placehold.co/800x400/e2e8f0/4a5568?text=Click+to+upload+image';
        dom.entryImageUpload.value = '';
        dom.aiInsightsContainer.classList.add('hidden');
        dom.aiSentiment.textContent = '';
        dom.aiSummary.textContent = '';
        setEntryViewState(isEditable, isNew);
        showView('entry-view');
    };

    const renderCalendar = (date) => {
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
            
            dayDiv.className = `p-2 border-r border-b calendar-day transition-colors cursor-pointer hover:bg-gray-100`;
            if (isToday) dayDiv.classList.add('bg-blue-50');
            
            dayDiv.innerHTML = `
                <div class="font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}">${i}</div>
                <div class="calendar-day-mood-bg"></div>
            `;
    
            const entriesForDay = journalEntries.filter(m => m.date === dateStr);
            if (moods[dateStr]) {
                dayDiv.innerHTML += `<div class="text-2xl text-center">${moods[dateStr]}</div>`;
                const moodColor = moodMap[moods[dateStr]]?.color || 'transparent';
                dayDiv.querySelector('.calendar-day-mood-bg').style.backgroundColor = moodColor;
            }
            if (entriesForDay.length > 0) {
                dayDiv.innerHTML += `<div class="w-2 h-2 rounded-full mx-auto mt-1 bg-blue-500"></div>`;
            }
            
            dayDiv.addEventListener('click', () => handleCalendarDayClick(currentDate, dateStr, entriesForDay));
    
            dom.calendarGrid.appendChild(dayDiv);
        }
    };

    const handleCalendarDayClick = (currentDate, dateStr, entriesForDay) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (currentDate > today) {
            showCustomAlert("You cannot create or view entries for a future date.", "Future Date");
            return;
        }

        const isTodayFlag = dateStr === getLocalDateString(new Date());

        if (entriesForDay.length === 0) {
            if (isTodayFlag) {
                openEntryForEditing(null, true, dateStr);
            } else {
                showCustomAlert("There is no journal entry for this date.", "No Entry");
            }
        } else if (entriesForDay.length === 1) {
            openEntryForEditing(entriesForDay[0], isTodayFlag, dateStr);
        } else {
            showEntrySelectionModal(entriesForDay, isTodayFlag);
        }
    };

    const showEntrySelectionModal = (entries, isEditable) => {
        dom.entrySelectionList.innerHTML = '';
        dom.entrySelectionTitle.textContent = `Entries for ${new Date(entries[0].date).toLocaleDateString()}`;

        entries.forEach(entry => {
            const button = document.createElement('button');
            button.className = 'w-full text-left p-3 bg-gray-100 rounded-lg hover:bg-gray-200';
            button.textContent = entry.title;
            button.onclick = () => {
                dom.entrySelectionModal.classList.remove('active');
                openEntryForEditing(entry, isEditable, entry.date);
            };
            dom.entrySelectionList.appendChild(button);
        });

        dom.entrySelectionModal.classList.add('active');
    };

    const renderMoodTracker = () => {
        if (moodChartInstance) {
            moodChartInstance.destroy();
        }
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
            d.setDate(d.getDate() + 1);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        const weekMoods = last7Days.map(d => moods[d]).filter(Boolean);
        if (weekMoods.length > 0) {
            let highScore = -1, lowScore = 6;
            let highEmoji = '', lowEmoji = '';
            weekMoods.forEach(emoji => {
                const score = moodMap[emoji]?.score;
                if(score > highScore) { highScore = score; highEmoji = emoji; }
                if(score < lowScore) { lowScore = score; lowEmoji = emoji; }
            });
            dom.weeklyHighDiv.textContent = highEmoji;
            dom.weeklyLowDiv.textContent = lowEmoji;
        } else {
             dom.weeklyHighDiv.textContent = '...';
             dom.weeklyLowDiv.textContent = '...';
        }

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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const score = context.raw;
                                if (score === null) return 'No data';
                                const mood = Object.entries(moodMap).find(([emoji, data]) => data.score === score);
                                return mood ? `Mood: ${mood[0]}` : 'No data';
                            }
                        }
                    }
                }
            }
        });
    };

    const startBreathing = () => {
        dom.breathingSetup.style.display = 'none';
        dom.breathingFeedback.style.display = 'none';
        dom.breathingSession.style.display = 'flex';
        let timeLeft = breathingDuration;
        const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            dom.breathingTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };
        countdownInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                clearInterval(breathingInterval);
                dom.breathingSession.style.display = 'none';
                dom.breathingFeedback.style.display = 'flex';
            }
        }, 1000);
        const runCycle = () => {
            dom.breathingCircle.classList.remove('breathe-out');
            dom.breathingInstruction.textContent = 'Breathe In';
            dom.breathingCircle.classList.add('breathe-in');
            setTimeout(() => { dom.breathingInstruction.textContent = 'Hold'; }, 4000);
            setTimeout(() => {
                dom.breathingInstruction.textContent = 'Breathe Out';
                dom.breathingCircle.classList.remove('breathe-in');
                dom.breathingCircle.classList.add('breathe-out');
            }, 8000);
        };
        updateTimer();
        runCycle();
        breathingInterval = setInterval(runCycle, 12000);
    };

    const promptForMood = async () => {
        const todayStr = getLocalDateString(new Date());
        if (localStorage.getItem(`moodPromptLastShown_${userId}`) !== todayStr) {
            dom.moodModal.classList.add('active');
        }
    };

    const encodeImageAsBase64 = (file) => {
        return new Promise((resolve) => {
            if (file.size > 750 * 1024) {
                showCustomAlert('Image is too large. Please choose a file smaller than 750KB.', 'File Size Error');
                return resolve(null);
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => {
                showCustomAlert('Could not read the image file.', 'File Error');
                resolve(null);
            };
            reader.readAsDataURL(file);
        });
    };

    const openMobileSidebar = () => {
        dom.mobileSidebarOverlay.classList.remove('hidden');
        dom.mobileSidebarMenu.classList.remove('-translate-x-full');
    };
    const closeMobileSidebar = () => {
        dom.mobileSidebarOverlay.classList.add('hidden');
        dom.mobileSidebarMenu.classList.add('-translate-x-full');
    };
    
    const formatText = (command) => {
        document.execCommand(command, false, null);
        dom.entryContentEditor.focus();
    };

    const updateStreak = async (settings) => {
        const today = new Date();
        const todayStr = getLocalDateString(today);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        let currentStreak = settings.streak || 0;
        const lastEntryDate = settings.lastEntryDate;

        if (lastEntryDate) {
            if (lastEntryDate !== todayStr && lastEntryDate !== yesterdayStr) {
                currentStreak = 0;
            }
        } else {
            currentStreak = 0;
        }

        dom.streakCount.textContent = currentStreak;
    };

    const setDailyPrompt = async () => {
        const todayStr = getLocalDateString(new Date());
        const storedPromptData = JSON.parse(localStorage.getItem('dailyPrompt'));

        if (storedPromptData && storedPromptData.date === todayStr) {
            dom.promptOfTheDayText.textContent = storedPromptData.prompt;
        } else {
            try {
                const response = await fetch('/api/get-daily-prompt', { method: 'POST' });
                if (!response.ok) throw new Error('Failed to fetch prompt');
                
                const result = await response.json();
                const prompt = result.candidates[0].content.parts[0].text.replace(/"/g, '');

                dom.promptOfTheDayText.textContent = prompt;
                localStorage.setItem('dailyPrompt', JSON.stringify({ date: todayStr, prompt: prompt }));
            } catch (error) {
                console.error("Error fetching daily prompt:", error);
                dom.promptOfTheDayText.textContent = "What's one small thing that made you smile today?";
            }
        }
    };
    
    const getAIPromptForEditor = async () => {
        dom.aiPromptBtn.disabled = true;
        dom.aiPromptBtn.innerHTML = `<i data-feather="loader" class="w-5 h-5 animate-spin"></i> Generating...`;
        feather.replace();
    
        try {
            const response = await fetch('/api/get-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
    
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    
            const result = await response.json();
    
            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const generatedText = result.candidates[0].content.parts[0].text;
                dom.entryContentEditor.innerHTML = `<p><em>${generatedText.trim()}</em></p><p><br></p>` + dom.entryContentEditor.innerHTML;
                dom.entryContentEditor.focus();
            } else {
                throw new Error("Invalid AI response format.");
            }
    
        } catch (error) {
            console.error("Error getting AI prompt:", error);
            showCustomAlert(`Sorry, could not get a prompt right now. ${error.message}`, "AI Error");
        } finally {
            dom.aiPromptBtn.disabled = false;
            dom.aiPromptBtn.innerHTML = `<i data-feather="edit-3" class="w-5 h-5"></i> Get AI Prompt`;
            feather.replace();
        }
    };

    const analyzeEntry = async () => {
        const entryText = dom.entryContentEditor.innerText;
        if (!entryText.trim()) {
            showCustomAlert("There's nothing to analyze. Please write something first.", "Empty Entry");
            return;
        }

        dom.analyzeEntryBtn.disabled = true;
        dom.analyzeEntryBtn.innerHTML = `<i data-feather="loader" class="w-5 h-5 animate-spin"></i> Analyzing...`;
        feather.replace();

        try {
            const response = await fetch('/api/summarize-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: entryText })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get analysis from the server.');
            }

            const result = await response.json();
            
            if (result.summary && result.sentiment) {
                dom.aiSummary.textContent = result.summary;
                dom.aiSentiment.textContent = result.sentiment;
                dom.aiInsightsContainer.classList.remove('hidden');
                feather.replace();
            } else {
                throw new Error('Invalid response format from analysis API.');
            }

        } catch (error) {
            console.error("Error analyzing entry:", error);
            showCustomAlert(`Sorry, we couldn't analyze this entry right now. ${error.message}`, "AI Error");
        } finally {
            dom.analyzeEntryBtn.disabled = false;
            dom.analyzeEntryBtn.innerHTML = `<i data-feather="sparkles" class="w-5 h-5"></i> Analyze Entry`;
            feather.replace();
        }
    };

    const recognizePatterns = async () => {
        if (journalEntries.length < 3) {
            showCustomAlert("You need at least 3 journal entries to analyze patterns.", "Not Enough Data");
            return;
        }

        dom.analyzePatternsBtn.disabled = true;
        dom.analyzePatternsBtn.innerHTML = `<i data-feather="loader" class="w-5 h-5 animate-spin"></i> Finding Patterns...`;
        feather.replace();
        dom.patternsResultContainer.innerHTML = '';

        try {
            const response = await fetch('/api/recognize-patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: journalEntries, moods: moods })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to get patterns from the server.');
            }

            const patterns = await response.json();
            
            if (patterns && Array.isArray(patterns) && patterns.length > 0) {
                patterns.forEach(pattern => {
                    const patternEl = document.createElement('div');
                    patternEl.className = 'bg-gray-100 p-4 rounded-lg';
                    patternEl.innerHTML = `
                        <h4 class="font-semibold text-gray-800">${pattern.title}</h4>
                        <p class="text-gray-600">${pattern.description}</p>
                    `;
                    dom.patternsResultContainer.appendChild(patternEl);
                });
            } else {
                dom.patternsResultContainer.innerHTML = `<p class="text-gray-500">No significant patterns were found at this time. Keep journaling to discover more insights!</p>`;
            }

        } catch (error) {
            console.error("Error recognizing patterns:", error);
            showCustomAlert(`Sorry, we couldn't analyze patterns right now. ${error.message}`, "AI Error");
            dom.patternsResultContainer.innerHTML = `<p class="text-red-500">An error occurred during analysis.</p>`;
        } finally {
            dom.analyzePatternsBtn.disabled = false;
            dom.analyzePatternsBtn.innerHTML = `<i data-feather="search" class="mr-2"></i> Re-Analyze Patterns`;
            feather.replace();
        }
    };


    const applySettings = (settings) => {
        if (settings.profilePicture) {
            dom.sidebarProfilePic.src = settings.profilePicture;
            dom.settingsProfilePic.src = settings.profilePicture;
        }
        if (settings.theme) {
            document.body.classList.remove(...THEME_CLASSES);
            document.body.classList.add(settings.theme);
            dom.themeOptions.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.theme === settings.theme);
            });
        }
    };

    const saveSetting = async (setting) => {
        const settingsRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/settings`, 'userProfile');
        try {
            await setDoc(settingsRef, setting, { merge: true });
        } catch (error) {
            console.error("Error saving setting:", error);
            showCustomAlert("Could not save your preference.", "Error");
        }
    };

    // --- Event Listeners Setup (MERGED & COMPLETE) ---
    function setupEventListeners() {
        dom.logoutBtn.addEventListener('click', () => signOut(auth));
        dom.prevMonthBtn.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(currentCalendarDate); });
        dom.nextMonthBtn.addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(currentCalendarDate); });
        
        dom.saveBtn.addEventListener('click', async () => {
            if (!currentEditingDate) {
                showCustomAlert('Could not determine the date for this entry.', 'Save Error');
                return;
            }
            if (!dom.entryTitleInput.value.trim()) {
                showCustomAlert('Please enter a title.');
                return;
            }
            
            dom.saveBtn.disabled = true;
            dom.saveBtn.textContent = 'Saving...';

            let imageUrl = dom.entryImagePreview.src;
            const file = dom.entryImageUpload.files[0];

            if (file) {
                const base64String = await encodeImageAsBase64(file);
                if (base64String === null) {
                    dom.saveBtn.disabled = false;
                    dom.saveBtn.textContent = 'Save';
                    return;
                }
                imageUrl = base64String;
            } else if (!imageUrl.startsWith('data:image')) {
                imageUrl = null;
            }

            const entryData = {
                title: dom.entryTitleInput.value,
                text: dom.entryContentEditor.innerHTML,
                image: imageUrl,
                isHappy: dom.happyMemoryCheckbox.checked,
                date: currentEditingDate,
                timestamp: serverTimestamp()
            };

            try {
                if (editingMemoryId) {
                    // Editing an existing entry
                    const docRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/journalEntries`, editingMemoryId);
                    await setDoc(docRef, entryData, { merge: true });
                } else {
                    // Creating a new entry
                    const collectionRef = collection(db, `artifacts/${canvasAppId}/users/${userId}/journalEntries`);
                    await addDoc(collectionRef, entryData);
                }
                
                const settingsRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/settings`, 'userProfile');
                const settingsDoc = await getDoc(settingsRef);
                const settings = settingsDoc.data() || {};
                const todayStr = getLocalDateString(new Date());
                if (settings.lastEntryDate !== todayStr) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = getLocalDateString(yesterday);
                    const newStreak = (settings.lastEntryDate === yesterdayStr) ? (settings.streak || 0) + 1 : 1;
                    await saveSetting({ streak: newStreak, lastEntryDate: todayStr });
                }

                showView('calendar-view');
                showCustomAlert('Memory saved!', 'Success');
            } catch (error) {
                console.error("Save Error:", error);
                showCustomAlert('Failed to save memory.', 'Error');
            } finally {
                dom.saveBtn.disabled = false;
                dom.saveBtn.textContent = 'Save';
            }
        });

        dom.deleteBtn.addEventListener('click', async () => {
            const docIdToDelete = editingMemoryId;
            if (!docIdToDelete) return;
            if (await showCustomAlert('Delete this memory?', 'Confirm', false, '', true)) {
                try {
                    await deleteDoc(doc(db, `artifacts/${canvasAppId}/users/${userId}/journalEntries`, docIdToDelete));
                    showView('calendar-view');
                    showCustomAlert('Memory deleted.', 'Success');
                } catch (error) {
                    console.error("Delete Error:", error);
                    showCustomAlert('Failed to delete memory.', 'Error');
                }
            }
        });
        
        dom.durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'custom-duration-btn') return;
                dom.durationBtns.forEach(b => b.classList.remove('selected-duration-btn'));
                btn.classList.add('selected-duration-btn');
                breathingDuration = parseInt(btn.dataset.duration);
                dom.startBreathingBtn.disabled = false;
                dom.customDurationBtn.textContent = "Custom";
            });
        });

        dom.customDurationBtn.addEventListener('click', async () => {
            const minutes = await showCustomAlert('Enter duration in minutes:', 'Custom Duration', true, '3');
            if (minutes && !isNaN(minutes) && Number(minutes) > 0) {
                const totalSeconds = Math.round(Number(minutes) * 60);
                breathingDuration = totalSeconds;
                dom.durationBtns.forEach(b => b.classList.remove('selected-duration-btn'));
                dom.customDurationBtn.classList.add('selected-duration-btn');
                dom.customDurationBtn.textContent = `${minutes} min`;
                dom.startBreathingBtn.disabled = false;
            } else if (minutes !== null) {
                showCustomAlert('Please enter a valid number of minutes.', 'Invalid Input');
            }
        });
        
        dom.startBreathingBtn.addEventListener('click', startBreathing);
        dom.feedbackEmojis.forEach(emoji => emoji.addEventListener('click', resetBreathingSession));
        
        dom.entryImageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { dom.entryImagePreview.src = e.target.result; };
                reader.readAsDataURL(file);
            }
        });
        
        dom.navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); showView(link.dataset.target); }));
        
        dom.addEntryBtn.addEventListener('click', () => {
            const todayStr = getLocalDateString(new Date());
            const entriesToday = journalEntries.filter(e => e.date === todayStr);
            if (entriesToday.length >= 3) {
                showCustomAlert("You have reached the maximum of 3 entries for today.", "Entry Limit Reached");
            } else {
                openEntryForEditing(null, true, todayStr);
            }
        });

        dom.moodEmojis.forEach(emoji => emoji.addEventListener('click', async () => {
            const todayStr = getLocalDateString(new Date());
            try {
                await setDoc(doc(db, `artifacts/${canvasAppId}/users/${userId}/moods`, todayStr), { moodEmoji: emoji.dataset.mood });
                localStorage.setItem(`moodPromptLastShown_${userId}`, todayStr);
                dom.moodModal.classList.remove('active');
            } catch (error) {
                console.error("Mood Save Error:", error);
                showCustomAlert("Could not save your mood.", "Error");
            }
        }));

        dom.customAlertOkBtn.addEventListener('click', () => {
            const isPrompt = !document.getElementById('custom-alert-input').classList.contains('hidden');
            resolveCustomPrompt(isPrompt ? document.getElementById('custom-alert-input').value : true);
            document.getElementById('custom-alert-modal').classList.remove('active');
        });

        dom.customAlertCancelBtn.addEventListener('click', () => {
            resolveCustomPrompt(null);
            document.getElementById('custom-alert-modal').classList.remove('active');
        });

        dom.mobileMenuBtn.addEventListener('click', openMobileSidebar);
        dom.closeMobileMenuBtn.addEventListener('click', closeMobileSidebar);
        dom.mobileSidebarOverlay.addEventListener('click', closeMobileSidebar);
        dom.addEntryBtnMobile.addEventListener('click', () => dom.addEntryBtn.click());
        dom.logoutBtnMobile.addEventListener('click', () => dom.logoutBtn.click());
        dom.formatButtons.forEach(button => button.addEventListener('click', () => formatText(button.dataset.command)));
        dom.backBtn.addEventListener('click', () => showView('calendar-view'));

        dom.promptOfTheDaySection.addEventListener('click', () => {
            const promptText = dom.promptOfTheDayText.textContent;
            openEntryForEditing(null, true, getLocalDateString(new Date()), `<p><em>${promptText}</em></p><p><br></p>`);
        });
        
        const openGratitudeModal = () => dom.gratitudeModal.classList.add('active');
        const closeGratitudeModal = () => dom.gratitudeModal.classList.remove('active');

        dom.gratitudeBtn.addEventListener('click', openGratitudeModal);
        dom.gratitudeBtnMobile.addEventListener('click', openGratitudeModal);
        dom.gratitudeCancelBtn.addEventListener('click', closeGratitudeModal);

        dom.gratitudeSaveBtn.addEventListener('click', async () => {
            const gratitudes = [
                document.getElementById('gratitude-1').value.trim(),
                document.getElementById('gratitude-2').value.trim(),
                document.getElementById('gratitude-3').value.trim()
            ].filter(g => g);

            if (gratitudes.length === 0) {
                showCustomAlert("Please enter at least one thing you're grateful for.", "Empty List");
                return;
            }

            const todayStr = getLocalDateString(new Date());
            const gratitudeData = {
                gratitudes: gratitudes,
                timestamp: serverTimestamp()
            };

            try {
                const gratitudeRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/gratitudes`, todayStr);
                await setDoc(gratitudeRef, gratitudeData);
                closeGratitudeModal();
                showCustomAlert("Gratitude list saved!", "Success");
            } catch (error) {
                console.error("Error saving gratitude:", error);
                showCustomAlert("Could not save your gratitude list.", "Error");
            }
        });

        dom.aiPromptBtn.addEventListener('click', getAIPromptForEditor);
        dom.analyzeEntryBtn.addEventListener('click', analyzeEntry);
        dom.analyzePatternsBtn.addEventListener('click', recognizePatterns);
        dom.entrySelectionCancelBtn.addEventListener('click', () => dom.entrySelectionModal.classList.remove('active'));

        dom.profilePicUpload.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const base64String = await encodeImageAsBase64(file);
                if (base64String) {
                    await saveSetting({ profilePicture: base64String });
                    showCustomAlert("Profile picture updated!", "Success");
                }
            }
        });

        dom.themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                saveSetting({ theme: theme });
            });
        });

        // NEW: Diary navigation event listeners
        if(dom.diaryPrevBtn) {
            dom.diaryPrevBtn.addEventListener('click', () => {
                if (currentMemoryIndex > 0) {
                    currentMemoryIndex--;
                    updateDiaryDisplay();
                }
            });
        }
        if(dom.diaryNextBtn) {
            dom.diaryNextBtn.addEventListener('click', () => {
                if (currentMemoryIndex < happyMemories.length - 1) {
                    currentMemoryIndex++;
                    updateDiaryDisplay();
                }
            });
        }
    }
});
