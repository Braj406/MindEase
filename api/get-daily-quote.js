// This function will be run by Vercel when a request is made to /api/get-daily-quote

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }
    
    const prompt = "Generate a short, inspirational quote about mindfulness or self-reflection. The quote should be attributed to a famous philosopher, writer, or thinker. Format the response as only the quote and the author, like this: 'The journey of a thousand miles begins with a single step.' - Lao Tzu";

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined in the server environment variables.");
            return res.status(500).json({ message: "Server configuration error: API key is missing." });
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

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('Gemini API Error:', responseData);
            return res.status(apiResponse.status).json({ message: 'Error from Gemini API', details: responseData });
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Error in /api/get-daily-quote endpoint:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
