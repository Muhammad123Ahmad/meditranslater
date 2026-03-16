# MediTranslate — AI-Powered Healthcare Translation

**Live Prototype:** [https://meditranslater.vercel.app/](https://meditranslater.vercel.app/)

## 🏥 Project Overview
MediTranslate is a real-time, multilingual healthcare translation prototype designed to bridge the language gap between patients and healthcare providers. It enables voice-to-text capture, AI-driven medical translation, and high-quality audio playback in over 20 languages.

---

## 🚀 Core Features
- **AI-Enhanced Voice-to-Text**: Captures spoken clinical input with high accuracy.
- **Real-Time Medical Translation**: Specifically prompted to preserve medical terminology (medications, dosages, anatomical terms).
- **High-Quality Audio Playback**: Cloud-based TTS for natural pronunciation in any language (including Urdu, Arabic, and Chinese).
- **Mobile-First Design**: Fully responsive clinical interface optimized for tablets and smartphones.
- **Zero-Retention Privacy**: No patient data, audio, or transcripts are ever stored on a server or database.

---

## 🛠 Technical Structure & Stack
The application is built as a highly performant, serverless web application.

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism design), and Modern JavaScript (ES6+).
- **Speech Recognition**: Web Speech API (Native Browser Engine).
- **Translation Engine**: **Groq Cloud AI** (Llama 3.3 70B Model) for near-instant, clinical-grade translation.
- **Speech Synthesis**: Google Cloud TTS API (for consistent cross-browser audio).
- **Backend Architecture**: Vercel Serverless Functions (`/api/translate.js`) to process AI requests securely.

### **File Structure**
```text
├── api/
│   └── translate.js    # Secure backend proxy (handles AI calls & keys)
├── index.html          # Clinical Dashboard UI
├── style.css           # Premium medical theme (Dark Mode)
├── app.js              # Core frontend logic & Speech orchestration
├── config.js           # Frontend configuration
├── vercel.json         # Deployment & security headers
└── .gitignore          # Prevents sensitive local keys from being uploaded
```

---

## 🔐 Security & Privacy Considerations
1. **API Key Protection**: All sensitive API keys are hidden on the **Vercel Secure Server Environment**. The browser/client never sees the Groq key, preventing unauthorized usage or leaks.
2. **Encryption**: All communication between the user's browser, the backend proxy, and the AI models is transmitted over **HTTPS (TLS 1.3)**.
3. **Privacy by Design**: 
   - No database.
   - No cookies or LocalStorage used for transcripts.
   - Data is temporary and destroyed the moment the app is cleared or the tab is closed.
4. **Security Headers**: `vercel.json` implements `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict `Referrer-Policy`.

---

## 📖 User Guide
### **1. Setup**
- Open the live link in **Google Chrome** or **Microsoft Edge** (browsers with the best Web Speech support).
- Grant microphone permissions when prompted.

### **2. Translating a Consultation**
- Select the **"Speaking In"** language (e.g., English).
- Select the **"Translate To"** language (e.g., Urdu or Spanish).
- Click the **Large Blue Microphone** and start speaking your clinical observation.
- Click the button again (or wait for the pause) to stop.
- The **original text** and **translated text** will appear in the dual panels.

### **3. Audio Playback**
- Click the **🔊 Speak** button under the translation to play the audio back to the patient.

### **4. Clearing Data**
- Click the **🗑️ Clear All** button at the bottom to wipe the current transcript and start a new patient consultation.

---

## 🤖 Generative AI Usage
This project was developed using **Antigravity (Google DeepMind)**. 
- **Coding**: AI assisted in architecting the speech event listeners, the CSS glassmorphism system, and the secure serverless proxy.
- **Translation**: AI is utilized via the Groq Cloud API to provide context-aware medical translations that standard translation engines often miss.
