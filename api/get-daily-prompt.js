// This function will be run by Vercel when a request is made to /api/get-daily-prompt

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // We only want to allow POST requests to this endpoint
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const prompt = "Generate a short, single-sentence journal prompt to inspire self-reflection and mindfulness. Examples: 'What is a small victory you had today?', 'Describe a sound that brings you comfort.', 'What is something you are looking forward to this week?'.";

    try {
        // Vercel will provide the API key from your project's environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined in the server environment variables.");
            return res.status(500).json({ message: "Server configuration error: API key is missing." });
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 50,
            }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('Gemini API Error:', responseData);
            return res.status(apiResponse.status).json({ message: 'Error from Gemini API', details: responseData });
        }

        // Send the successful response back to the frontend
        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error in /api/get-daily-prompt endpoint:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
