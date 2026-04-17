const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Proxy Gemini API using environment variables

/**
 * getSecureQuestion
 * Fetches a question from Gemini securely using cloud-side API keys.
 */
exports.getSecureQuestion = onCall(async (request) => {
    // Authenticate the user
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
         throw new HttpsError("internal", "API Key missing in backend environment.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // We use gemini-1.5-flash for the fastest game experience
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a challenging multiple-choice trivia question about science, history, or pop culture.
    Return ONLY a valid JSON object with the following structure, nothing else:
    {
        "question": "The question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct": 0
    }
    The "correct" value should be the index (0-3) of the correct answer.`;

    try {
        const result = await model.generateContent(prompt);
        const aiText = result.response.text();
        
        // Robust JSON extraction
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON not found");
        
        const questionData = JSON.parse(jsonMatch[0]);
        
        return {
            question: questionData.question,
            options: questionData.options,
            correct: parseInt(questionData.correct)
        };
    } catch (error) {
        console.error("Gemini Cloud Error:", error);
        throw new HttpsError("internal", "Failed to generate AI question.");
    }
});

/**
 * saveSecureScore
 * Validates the score and name before writing to Firestore.
 */
exports.saveSecureScore = onCall(async (request) => {
    const { name, score } = request.data;
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "Auth required.");
    }

    // Validation (Antigravity Rule)
    if (typeof score !== "number" || score < 0 || score > 9999) {
        throw new HttpsError("invalid-argument", "Invalid score.");
    }
    if (typeof name !== "string" || name.length < 2 || name.length > 20) {
        throw new HttpsError("invalid-argument", "Name too short/long.");
    }

    try {
        const scoreDoc = {
            name: name.trim(),
            score: Math.floor(score),
            timestamp: FieldValue.serverTimestamp(),
            uid: uid
        };

        await db.collection("scores").add(scoreDoc);
        return { success: true, message: "Score saved securely in the cloud." };
    } catch (error) {
        console.error("Firestore Save Error:", error);
        throw new HttpsError("internal", "Database save failed.");
    }
});
