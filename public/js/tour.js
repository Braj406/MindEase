// --- TOUR: This is a new file: js/tour.js ---

// --- TOUR: Import Firestore functions to save the user's tour status. ---
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Initializes and starts the application tour using Shepherd.js.
 * The tour completion status is saved per user in Firestore, not localStorage.
 * @param {object} db - The Firestore database instance.
 * @param {string} userId - The UID of the currently authenticated user.
 * @param {string} canvasAppId - The ID of the application.
 */
export function startAppTour(db, userId, canvasAppId) {
    
    // The check to see if the tour should run is now handled in main.js
    // by checking the user's settings in Firestore.

    const tour = new Shepherd.Tour({
        useModalOverlay: true, // This darkens the background to focus on the tour steps.
        defaultStepOptions: {
            classes: 'shadow-xl bg-white rounded-lg shepherd-custom',
            scrollTo: { behavior: 'smooth', block: 'center' }, // Smoothly scroll to elements.
            cancelIcon: {
                enabled: true,
                label: 'Close tour'
            },
            // Define default buttons for steps.
            buttons: [
                {
                    action() {
                        return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back',
                },
                {
                    action() {
                        return this.next();
                    },
                    text: 'Next',
                },
            ],
        },
    });

    // Helper function to ensure we are on the correct view before showing a step.
    const navigateToView = (viewId) => {
        const view = document.getElementById(viewId);
        if (view && !view.classList.contains('active')) {
            // Find the corresponding nav link and click it to switch views.
            document.querySelector(`.nav-link[data-target="${viewId}"]`).click();
        }
    };
    
    // Define all the steps of our interactive tour.
    tour.addSteps([
        {
            id: 'welcome',
            title: 'Welcome to MindEase!',
            text: 'Let\'s take a quick tour of the features to get you started on your mindfulness journey.',
            buttons: [{ action() { return this.next(); }, text: 'Start Tour' }],
        },
        {
            id: 'calendar-view',
            title: 'Your Calendar',
            text: 'This is your main dashboard. You can see your daily moods and which days have a journal entry. Click a day to get started.',
            attachTo: { element: '#calendar-view', on: 'bottom' },
            when: { 'before-show': () => navigateToView('calendar-view') }
        },
        {
            id: 'daily-quote',
            title: 'Daily Inspiration',
            text: 'Get a new motivational quote here every day to brighten your morning.',
            attachTo: { element: '#daily-quote-section', on: 'bottom' },
            when: { 'before-show': () => navigateToView('calendar-view') }
        },
        {
            id: 'new-entry',
            title: 'Create a New Entry',
            text: 'Click here anytime to write a new journal entry for the current day.',
            attachTo: { element: '#add-entry-btn', on: 'right' },
            when: { 'before-show': () => navigateToView('calendar-view') }
        },
        {
            id: 'entry-editor',
            title: 'The Editor',
            text: 'After clicking "New Entry", you\'ll land here. You can write your title, add an image, and format your thoughts.',
            attachTo: { element: '#entry-view', on: 'bottom' },
            // Before showing this step, simulate a click to open the new entry view.
            when: { 'before-show': () => document.getElementById('add-entry-btn').click() }
        },
        {
            id: 'ai-prompt',
            title: 'Feeling Stuck?',
            text: 'If you don\'t know what to write, click here to get a unique, AI-generated prompt!',
            attachTo: { element: '#ai-prompt-btn', on: 'top' },
        },
        {
            id: 'happy-memories-check',
            title: 'Save Happy Moments',
            text: 'Check this box to save an entry as a "Happy Memory," making it easy to find and revisit later.',
            attachTo: { element: '#happy-memory-container', on: 'top' },
        },
        {
            id: 'happy-memories-view',
            title: 'Revisit Happy Memories',
            text: 'All your saved happy memories are collected here for you to look back on anytime you need a boost.',
            attachTo: { element: 'a[data-target="memories-view"]', on: 'right' },
            when: { 'before-show': () => navigateToView('memories-view') }
        },
        {
            id: 'mood-tracker',
            title: 'Track Your Mood',
            text: 'Visualize your mood trends over the last week to gain insight into your emotional well-being.',
            attachTo: { element: 'a[data-target="mood-tracker-view"]', on: 'right' },
            when: { 'before-show': () => navigateToView('mood-tracker-view') }
        },
        {
            id: 'breathing-exercise',
            title: 'Mindful Breathing',
            text: 'Take a moment to relax and refocus with a guided breathing exercise. It\'s a great way to manage stress.',
            attachTo: { element: 'a[data-target="breathing-view"]', on: 'right' },
            when: { 'before-show': () => navigateToView('breathing-view') }
        },
        {
            id: 'settings',
            title: 'Customize Your Experience',
            text: 'In Settings, you can change your profile picture and choose a new color theme to make the app feel like your own.',
            attachTo: { element: 'a[data-target="settings-view"]', on: 'right' },
            when: { 'before-show': () => navigateToView('settings-view') }
        },
        {
            id: 'finish',
            title: "You're all set!",
            text: "Enjoy your journey with MindEase. We're happy to have you here.",
            when: { 'before-show': () => navigateToView('calendar-view') },
            buttons: [
                {
                    action() {
                        return this.complete();
                    },
                    text: 'Finish',
                },
            ],
        }
    ]);

    // --- TOUR: Updated function to save completion status to Firestore ---
    // When the tour is finished (completed) or closed (cancelled), mark it as done in Firestore.
    const markTourAsDone = async () => {
        if (!db || !userId || !canvasAppId) {
            console.error("Firebase details not provided to tour. Cannot save completion state.");
            return;
        }
        try {
            const settingsRef = doc(db, `artifacts/${canvasAppId}/users/${userId}/settings`, 'userProfile');
            // Use setDoc with merge:true to create or update the document without overwriting other settings.
            await setDoc(settingsRef, { tourCompleted: true }, { merge: true });
        } catch (error) {
            console.error("Error saving tour completion status:", error);
        }
        // Ensure we are back on the main calendar view after the tour ends.
        navigateToView('calendar-view');
    };

    tour.on('complete', markTourAsDone);
    tour.on('cancel', markTourAsDone);

    // Start the tour!
    tour.start();
}
