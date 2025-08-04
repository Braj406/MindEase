// This new function will be run by Vercel when a request is made to /api/recognize-patterns

const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const { entries, moods } = req.body;

    if (!entries || !moods || !Array.isArray(entries)) {
        return res.status(400).json({ message: 'Request body must contain "entries" array and "moods" object.' });
    }

    // A more complex prompt that asks for two things in a structured format.
    const prompt = `
        Act as a thoughtful wellness analyst. I will provide you with a series of journal entries and daily mood logs. 
        Your task is to identify up to 3 interesting patterns or correlations from this data.
        Focus on connections between days of the week, recurring topics in the text, and the logged moods.
        
        Provide a response in JSON format as an array of objects. Each object should have two keys: "title" and "description".
        - "title": A short, catchy headline for the insight (e.g., "Happiest on Weekends").
        - "description": A gentle, encouraging sentence explaining the pattern (e.g., "It seems you feel happiest on Saturdays and Sundays, often mentioning time with family.").

        Here is the data:
        ---
        Moods (date: mood emoji):
        ${JSON.stringify(moods, null, 2)}

        Journal Entries (date: text content):
        ${entries.map(e => `${e.date}: ${e.text.replace(/<[^>]*>?/gm, ' ')}`).join('\n')}
        ---

        Return only the JSON array of insights.
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
        
        const resultText = responseData.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(resultText);

        res.status(200).json(parsedResult);

    } catch (error) {
        console.error("Error in /api/recognize-patterns endpoint:", error);
        if (error instanceof SyntaxError) {
             res.status(500).json({ message: "AI response was not in the expected format." });
        } else {
             res.status(500).json({ message: "Internal server error." });
        }
    }
};
