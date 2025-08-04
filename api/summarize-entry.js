// This new function will be run by Vercel when a request is made to /api/summarize-entry

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ message: 'Request body must contain a non-empty "text" field.' });
    }

    // A more complex prompt that asks for two things in a structured format.
    const prompt = `
        Analyze the following journal entry. Provide a response in JSON format with two keys: "sentiment" and "summary".
        1. For "sentiment", identify the primary emotion (e.g., "Joyful", "Reflective", "Anxious", "Grateful", "Melancholy").
        2. For "summary", provide a concise summary of the entry in 1-2 sentences.

        Journal Entry:
        ---
        ${text}
        ---
    `;

    try {
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
            // Instruct the model to output JSON
            generationConfig: {
                responseMimeType: "application/json",
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
        
        // The model's response is a JSON string in the 'text' field, so we need to parse it.
        const resultText = responseData.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(resultText);

        // Send the parsed JSON object back to the client.
        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error in /api/summarize-entry endpoint:", error);
        // Check if the error is from parsing, which might mean the model didn't return valid JSON.
        if (error instanceof SyntaxError) {
             res.status(500).json({ message: "AI response was not in the expected format." });
        } else {
             res.status(500).json({ message: "Internal server error." });
        }
    }
};
