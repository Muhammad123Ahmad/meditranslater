# MediTranslate — AI-Powered Healthcare Translation

**Live Prototype:** [https://meditranslater.vercel.app/](https://meditranslater.vercel.app/)

## 🏥 Project Overview
MediTranslate is a real-time, multilingual healthcare translation prototype designed to bridge the language gap between patients and healthcare providers. It features a modern, conversational interface with role-aware AI translation and zero-retention privacy protocols.

---

## 🚀 Core Features
- **🔄 Conversational Two-Way Mode**: Unified chronological chat transcript between "Healthcare Provider" and "Patient".
- **🩺 Clinical Role Awareness**: AI dynamically adjusts its tone and terminology based on the speaker's role.
- **🎙️ Unified Clinical Dashboard**: Consolidated Role, Language, and Recording controls in a single, premium interface.
- **💎 Premium Aesthetics**: Modern dark-mode UI with glassmorphism effects and custom-styled clinical dropdowns.
- **🔊 Accurate Audio Playback**: Cloud-based TTS bypasses OS limitations for natural pronunciation in over 20 languages.
- **🔐 Zero-Retention Privacy**: Conversational data exists only in-memory; all transcripts are instantly wiped upon page refresh or clicking "Clear All".

---

## 🛠 Technical Structure & Stack
The application is built as a high-performance, serverless clinical tool.

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), and Modern JavaScript (ES6+).
- **Speech Recognition**: Web Speech API (Native Engine with URDU/HINDI fallbacks).
- **Translation Engine**: **Groq Cloud AI (Llama 3.3 70B)** — specifically prompted for literal medical precision.
- **Speech Synthesis**: Google Cloud TTS API (Integrated into chat bubbles).
- **Backend Architecture**: Vercel Serverless Functions (`/api/translate.js`) to process AI requests securely.

### **File Structure**
```text
├── api/
│   └── translate.js    # Secure backend proxy (handles Role context & AI keys)
├── index.html          # Unified Clinical Dashboard UI
├── style.css           # Custom-styled medical theme & Glassmorphism
├── app.js              # Conversational engine & Speech orchestration
├── config.js           # Frontend configuration
├── vercel.json         # Deployment & security headers
└── .gitignore          # Prevents sensitive local keys from being uploaded
```

---

## 🔐 Security & Privacy
1. **API Key Shielding**: Groq API keys are handled exclusively on Vercel's secure backend environment.
2. **Role-Based Context**: Speaker roles are passed to the AI to ensure diagnostic versus descriptive terminology accuracy.
3. **Zero-Persistence**: No database is used. Data resides in volatile memory and is never written to disk or local storage.
4. **Security Headers**: Strict CSP and Referrer-Policy implemented via `vercel.json`.

---

## 📖 User Guide
### **1. Setup**
- Open the live link in **Google Chrome** or **Microsoft Edge**.
- Grant microphone permissions.

### **2. Starting a Consultation**
- Select the **Speaker Role** (Provider or Patient).
- Choose the **"From"** and **"To"** languages in the unified control bar.
- Tap the **Microphone** to record. A live caption overlay will show your speech in real-time.
- Tap again to stop. The translation will be appended to the chronological history.

### **3. Review & Audio**
- View the interleaved chat bubbles.
- Tap **"Speak"** in any bubble to play the translation for the other person.
- Tap **"Copy"** to capture the clinical pair for external documentation.

### **4. Safety Exit**
- Click **🗑️ Clear All** to wipe the entire session history permanently.

---

## 🤖 Generative AI Usage
Developed using **Antigravity (Google DeepMind)**.
- **Architecture**: AI assisted in designing the chronological transcript engine and the secure serverless backend.
- **Refinement**: AI refined the clinical tone prompts and fixed complex CSS layout overlaps.
- **Execution**: Used for rapid prototyping and ensuring literal translation accuracy for medical safety.
