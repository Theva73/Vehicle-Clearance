// js/api.js
import { showNotification } from './utils.js';

const GEMINI_API_KEY = ""; // Kept empty as per instructions
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

export const callGeminiApi = async (prompt, maxRetries = 3) => {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const result = await response.json();
            
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                 throw new Error("Invalid response structure from Gemini API.");
            }

        } catch (error) {
            attempts++;
            console.error(`Gemini API call attempt ${attempts} failed:`, error);
            if (attempts >= maxRetries) {
                throw error;
            }
            const delay = Math.pow(2, attempts) * 1000;
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

export const sendEmail = async (to, subject, htmlBody) => {
    console.log("--- EMAIL SIMULATION ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("Body (HTML):");
    console.log(htmlBody);
    console.log("--- END EMAIL SIMULATION ---");
    showNotification(`Email notification sent to ${to}.`, "success");
};
