// This line imports the 'dotenv' package, which loads your secret keys from the .env file into process.env
require('dotenv').config();

// Import the necessary packages
const express = require('express');
// IMPORTANT FIX: Dynamically import node-fetch which is now an ES Module
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Create an instance of an Express application
const app = express();
const PORT = 3000; // The port your server will run on

// --- Middleware ---

// This serves all the static files (HTML, CSS, client-side JS) in the 'public' directory.
app.use(express.static('public'));

// This allows your server to understand incoming requests that have a JSON body.
app.use(express.json());


// --- API Routes ---

// This defines the secure endpoint that your frontend will call.
app.post('/api/get-prompt', async (req, res) => {
    const prompt = "Generate a short, single-sentence journal prompt to inspire self-reflection and mindfulness.";

    try {
        // Securely access your API key from the .env file.
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in the .env file.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };

        // The server makes the call to the Google AI API
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Error handling
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Gemini API Error:', errorText);
            return res.status(apiResponse.status).json({ message: 'Error from Gemini API', details: errorText });
        }

        // If the call is successful, get the JSON result
        const result = await apiResponse.json();

        // Send the successful response back to the frontend (main.js)
        res.json(result);

    } catch (error) {
        console.error("Error in /api/get-prompt endpoint:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

// --- Start the Server ---

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log("Make sure your .env file is created and contains your GEMINI_API_KEY.");
});
