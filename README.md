# AI Arena – Live Quiz Battle

A production-ready quiz game powered by AI (Gemini API) and real-time leaderboards (Firebase Firestore).

## 🚨 IMPORTANT: Firebase Setup Required

**The app won't work without proper Firebase configuration!** Follow these steps carefully.

### 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Click "Create a project" (or use existing)
- Name it "AI Arena Game" (or whatever you like)
- Enable Google Analytics if desired

### 2. Enable Services
- **Authentication**: Go to Authentication > Sign-in method > Enable "Anonymous"
- **Firestore**: Go to Firestore Database > Create database > Start in test mode (or set rules)

### 3. Get Configuration
- Go to Project Settings > General > Your apps
- Click "Add app" > Web app (</>) icon
- Register with name "AI Arena"
- Copy the config object and paste it into `config.js`

### 4. Update Config File
Replace the placeholders in `config.js` with your real Firebase config and Gemini API key.

## Features

- 🤖 AI-generated trivia questions on science, history, and pop culture
- 🏆 Real-time leaderboard with Firestore
- 📱 Responsive design for mobile and desktop
- ♿ Accessibility features (ARIA labels, screen reader support)
- 🔒 Secure API key handling (separate config file)
- ⚡ Modern JavaScript (ES6 modules, async/await)

## Quick Setup (if you have Firebase ready)

1. Update `config.js` with your keys
2. Open `index.html` in a browser
3. For local dev: `python -m http.server 8000` then visit `http://localhost:8000`

## Technologies

- HTML5, CSS3, ES6 JavaScript
- Firebase Firestore & Auth
- Google Gemini AI API

## Troubleshooting

- **"Authentication failed"**: Enable Anonymous Auth in Firebase
- **"configuration-not-found"**: Check project ID in config.js matches Firebase
- **Stuck on loading**: Check browser console for errors

## License

MIT License - feel free to use and modify!