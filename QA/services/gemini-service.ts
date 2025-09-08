import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables.
// By default, dotenv looks for the .env file in the current working directory.
// Since you run the script from within the QA directory, this works perfectly.
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

interface Message {
    user: { username: string };
    content: string;
}

/**
 * Generates a context-aware chat message using the Gemini API.
 * @param topic - The central theme of the conversation.
 * @param conversationHistory - An array of previous message objects.
 * @returns A promise that resolves to the generated message content.
 */
export async function generateAiChatMessage(topic: string, conversationHistory: Message[]): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("Gemini API key is not configured. Please add it to your QA/.env file.");
    }

    // Create a concise history string for the prompt
    const historyText = conversationHistory
        .map(msg => `${msg.user.username}: ${msg.content}`)
        .join('\n');

    // --- UPDATED: Changed the structure and persona of the AI's prompt ---
    const systemPrompt = `You are a helpful and knowledgeable expert on the topic of "${topic}".
Your tone should be professional but friendly.
Engage with the last message in the conversation and add a new insight or ask a clarifying question.
Keep your response concise, under 40 words.

Conversation so far:
${historyText}

Your turn:`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error (${response.status}): ${errorData.error.message}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
            throw new Error("Could not extract generated text from Gemini API response.");
        }

        return generatedText.trim();
    } catch (error) {
        console.error("Fatal error calling Gemini API:", error);
        // Provide a fallback message so the test doesn't completely crash
        return "I'm having trouble thinking of a response right now.";
    }
}

