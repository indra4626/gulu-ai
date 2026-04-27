// src/services/geminiApi.js
// Handles communication with the Google Gemini API

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Try these models in order — first one that works wins
const MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
];

const buildRequestBody = (systemPrompt, chatHistory) => {
    const contents = chatHistory.map(msg => ({
        role: msg.role === 'gulu' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    return {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents,
        generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    };
};

export const sendToGemini = async (apiKey, systemPrompt, chatHistory) => {
    if (!apiKey) throw new Error('API key not set');

    const requestBody = buildRequestBody(systemPrompt, chatHistory);
    const errors = [];

    for (const model of MODELS) {
        try {
            const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData?.error?.message || `${response.status}`;
                // If quota error, try next model
                if (response.status === 429 || msg.toLowerCase().includes('quota')) {
                    errors.push(`${model}: quota exceeded`);
                    continue;
                }
                throw new Error(msg);
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Empty response');

            console.log(`✅ GULU using model: ${model}`);
            return text;

        } catch (err) {
            errors.push(`${model}: ${err.message}`);
            continue;
        }
    }

    // All models failed
    throw new Error(
        'All models hit quota limits. Your API key may need activation.\n\n' +
        'Fix: Go to https://aistudio.google.com/apikey → Delete this key → Create a NEW key.\n\n' +
        'Details: ' + errors.join(' | ')
    );
};
