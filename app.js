import { firebaseConfig, GEMINI_API_KEY } from './config.js';

// Firebase imports (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth).catch(error => {
    console.error("Anonymous auth failed:", error);
});

// Game state
let currentQuestion = null;
let currentScore = 0;
let canAnswer = true;
let isLoading = false;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// DOM elements
const questionTextEl = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const nextBtn = document.getElementById("nextBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const playerNameInput = document.getElementById("playerName");
const submitScoreBtn = document.getElementById("submitScoreBtn");
const scoreListDiv = document.getElementById("scoreList");

// Leaderboard - Secure Read Access
const scoresRef = collection(db, "scores");
const leaderboardQuery = query(scoresRef, orderBy("score", "desc"), limit(10));

onSnapshot(leaderboardQuery, (snapshot) => {
    if (snapshot.empty) {
        scoreListDiv.innerHTML = '<div class="loading">✨ No scores yet. Be the first!</div>';
        return;
    }
    let rank = 1;
    let html = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        html += `<div class="score-item"><div class="rank">#${rank}</div><div class="name">${escapeHtml(data.name)}</div><div class="score">⚡ ${data.score} pts</div></div>`;
        rank++;
    });
    scoreListDiv.innerHTML = html;
}, (error) => {
    console.error("Leaderboard error:", error);
});

// Utility functions
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showError(message, detail = "") {
    questionTextEl.innerHTML = `<div class="error-header">⚠️ Error</div><div class="error-body">${message}</div>`;
    optionsContainer.innerHTML = `<div class="error-box"><p>${detail}</p></div>`;
    nextBtn.disabled = false;
    isLoading = false;
}

/**
 * FETCH NEW QUESTION (Browser to Gemini)
 */
async function fetchNewQuestion() {
    if (isLoading) return;
    isLoading = true;
    nextBtn.disabled = true;
    canAnswer = true;
    questionTextEl.textContent = "🤖 AI is crafting a question...";
    optionsContainer.innerHTML = '<div class="loading">Talking to Gemini...</div>';

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

        currentQuestion = questionData;
        questionTextEl.textContent = currentQuestion.question;

        // Render options securely
        optionsContainer.innerHTML = '';
        currentQuestion.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.classList.add('option-btn');
            btn.onclick = () => checkAnswer(idx);
            optionsContainer.appendChild(btn);
        });
        nextBtn.disabled = false;
    } catch (error) {
        console.error("Fetch Error:", error);
        showError("Couldn't reach Gemini AI.", error.message);
    } finally {
        isLoading = false;
    }
}

// Check answer
function checkAnswer(selectedIdx) {
    if (!canAnswer || !currentQuestion) return;

    const isCorrect = (selectedIdx === currentQuestion.correct);
    if (isCorrect) {
        currentScore += 10;
        scoreDisplay.textContent = `Score: ${currentScore}`;
    }

    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(btn => btn.disabled = true);
    btns[selectedIdx].style.background = isCorrect ? '#2ecc71' : '#e74c3c';
    btns[currentQuestion.correct].style.background = '#2ecc71';

    canAnswer = false;
}

/**
 * SAVE SCORE (Browser to Firestore)
 */
async function saveScore(name, score) {
    try {
        submitScoreBtn.disabled = true;
        await addDoc(scoresRef, { 
            name: name, 
            score: score, 
            timestamp: serverTimestamp() 
        });
        alert(`🎉 Score saved successfully!`);
    } catch (error) {
        console.error("Save Error:", error);
        alert(`Failed to save: ${error.message}`);
    } finally {
        submitScoreBtn.disabled = false;
    }
}

// Event listeners
nextBtn.addEventListener('click', fetchNewQuestion);

submitScoreBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName || playerName.length < 2 || playerName.length > 20) {
        alert("Enter a name between 2-20 characters!");
        return;
    }
    if (currentScore === 0) {
        alert("Play a round first!");
        return;
    }
    saveScore(playerName, currentScore);
});

// Boot game
fetchNewQuestion();