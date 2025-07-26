// This line imports the 'dotenv' package, which loads your secret keys from the .env file into process.env
require('dotenv').config();

// Import the necessary packages
const express = require('express');
// Dynamically import node-fetch which is now an ES Module
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Create an instance of an Express application
const app = express();
const PORT = process.env.PORT || 3000; // Use Vercel's port if available

// --- Middleware ---

// This serves all the static files (HTML, CSS, client-side JS) in the 'public' directory.
app.use(express.static('public'));

// This allows your server to understand incoming requests that have a JSON body.
app.use(express.json());


// --- API Routes ---

// Endpoint for generating journal prompts
app.post('/api/get-prompt', async (req, res) => {
    const prompt = "Generate a short, single-sentence journal prompt to inspire self-reflection and mindfulness.";

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in the .env file or server environment variables.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Gemini API Error:', errorText);
            return res.status(apiResponse.status).json({ message: 'Error from Gemini API', details: errorText });
        }

        const result = await apiResponse.json();
        res.json(result);

    } catch (error) {
        console.error("Error in /api/get-prompt endpoint:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Endpoint for generating a daily quote
app.post('/api/get-daily-quote', async (req, res) => {
    const prompt = "Generate a short, inspirational quote about mindfulness or self-reflection. The quote should be attributed to a famous philosopher, writer, or thinker. Format the response as only the quote and the author, like this: 'The journey of a thousand miles begins with a single step.' - Lao Tzu";

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in the .env file or server environment variables.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Gemini API Error:', errorText);
            return res.status(apiResponse.status).json({ message: 'Error from Gemini API', details: errorText });
        }

        const result = await apiResponse.json();
        res.json(result);

    } catch (error) {
        console.error("Error in /api/get-daily-quote endpoint:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});


// --- Start the Server ---

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
