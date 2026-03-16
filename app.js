/* ============================================================
   MEDITRANSLATE — APP.JS
   Speech Recognition → Gemini Translation → Speech Synthesis
   ============================================================ */

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'ur-PK', name: 'Urdu' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'fa-IR', name: 'Persian (Farsi)' },
  { code: 'bn-BD', name: 'Bengali' },
  { code: 'sw-KE', name: 'Swahili' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'vi-VN', name: 'Vietnamese' },
  { code: 'tl-PH', name: 'Filipino (Tagalog)' },
  { code: 'ms-MY', name: 'Malay' },
  { code: 'id-ID', name: 'Indonesian' },
];

// ── DOM refs ─────────────────────────────────────────────────
const sourceLangEl       = document.getElementById('sourceLang');
const targetLangEl       = document.getElementById('targetLang');
const swapBtn            = document.getElementById('swapBtn');
const micBtn             = document.getElementById('micBtn');
const micIcon            = document.getElementById('micIcon');
const stopIcon           = document.getElementById('stopIcon');
const pulseRing          = document.getElementById('pulseRing');
const micStatus          = document.getElementById('micStatus');
const browserWarning     = document.getElementById('browserWarning');
const chatViewport       = document.getElementById('chatViewport');
const emptyState         = document.getElementById('emptyState');
const liveCaptionBar     = document.getElementById('liveCaptionBar');
const liveText           = document.getElementById('liveText');
const roleBtns           = document.querySelectorAll('.role-btn');
const translatingInd     = document.getElementById('translatingIndicator');
const clearBtn           = document.getElementById('clearBtn');

// ── State ─────────────────────────────────────────────────────
let isRecording        = false;
let recognition        = null;
let finalTranscript    = '';
let currentRole        = 'provider'; 
let conversationHistory = []; 

// ── Role Management ───────────────────────────────────────────
roleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    roleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    
    // Efficiency: Swap languages based on role
    if (currentRole === 'patient') {
        const tmp = sourceLangEl.value;
        sourceLangEl.value = targetLangEl.value;
        targetLangEl.value = tmp;
    } else {
        if (sourceLangEl.value !== 'en-US' && targetLangEl.value === 'en-US') {
            const tmp = sourceLangEl.value;
            sourceLangEl.value = targetLangEl.value;
            targetLangEl.value = tmp;
        }
    }
  });
});

// ── Populate languages ────────────────────────────────────────
function populateLanguages() {
  LANGUAGES.forEach(lang => {
    sourceLangEl.appendChild(new Option(lang.name, lang.code));
    targetLangEl.appendChild(new Option(lang.name, lang.code));
  });
  sourceLangEl.value = 'en-US';
  targetLangEl.value = 'ur-PK';
}

sourceLangEl.addEventListener('change', () => { if (isRecording) stopRecording(false).then(startRecording); });
swapBtn.addEventListener('click', () => {
  const tmp = sourceLangEl.value;
  sourceLangEl.value = targetLangEl.value;
  targetLangEl.value = tmp;
});

// ── Recording ─────────────────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (isRecording) stopRecording();
  else startRecording();
});

function startRecording() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { browserWarning.classList.remove('hidden'); return; }
  
  recognition = new SR();
  let recLang = sourceLangEl.value;
  if (recLang === 'ur-PK') recLang = 'hi-IN'; // Urdu workaround
  if (recLang.startsWith('zh')) recLang = 'zh-CN';
  
  recognition.lang = recLang;
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('recording');
    pulseRing.classList.add('active');
    micIcon.classList.add('hidden');
    stopIcon.classList.remove('hidden');
    micStatus.textContent = 'Listening...';
    micStatus.className = 'mic-status active';
    liveCaptionBar.classList.remove('hidden');
    liveText.innerHTML = '<span class="interim-text">Waiting for speech...</span>';
    finalTranscript = '';
  };

  recognition.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
    }
    finalTranscript = final.trim();
    liveText.innerHTML = (finalTranscript ? `<span>${escapeHtml(finalTranscript)}</span>` : '') + 
                         (interim ? `<span class="interim-text"> ${escapeHtml(interim)}</span>` : '');
  };

  recognition.onerror = () => stopRecording(false);
  recognition.onend = () => { if (isRecording) recognition.start(); };
  recognition.start();
}

async function stopRecording(doTranslate = true) {
  isRecording = false;
  liveCaptionBar.classList.add('hidden');
  if (recognition) { recognition.onend = null; recognition.stop(); }
  micBtn.classList.remove('recording');
  pulseRing.classList.remove('active');
  micIcon.classList.remove('hidden');
  stopIcon.classList.add('hidden');

  let text = finalTranscript.trim();
  if (!text) {
      const interimSpan = liveText.querySelector('.interim-text');
      if (interimSpan && !interimSpan.textContent.includes('Waiting')) text = interimSpan.textContent.trim();
  }

  if (doTranslate && text) {
    micStatus.textContent = 'Translating...';
    translatingInd.classList.remove('hidden');
    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: LANGUAGES.find(l => l.code === sourceLangEl.value).name,
          targetLang: LANGUAGES.find(l => l.code === targetLangEl.value).name,
          role: currentRole
        })
      });
      const data = await resp.json();
      const translation = data.choices[0].message.content.trim();
      if (translation) {
        conversationHistory.push({
          role: currentRole,
          original: text,
          translation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          targetLangCode: targetLangEl.value
        });
        renderChat();
      }
    } catch (e) { console.error(e); }
    finally { translatingInd.classList.add('hidden'); micStatus.textContent = 'Ready'; }
  } else { micStatus.textContent = 'Ready'; }
}

function renderChat() {
  if (conversationHistory.length === 0) {
    emptyState.classList.remove('hidden');
    chatViewport.innerHTML = '';
    chatViewport.appendChild(emptyState);
    return;
  }
  emptyState.classList.add('hidden');
  chatViewport.innerHTML = conversationHistory.map((m, i) => `
    <div class="msg-group ${m.role}">
      <div class="msg-header">
        <span class="msg-role-label">${m.role === 'provider' ? 'Provider' : 'Patient'}</span>
        <span class="msg-time">${m.timestamp}</span>
      </div>
      <div class="bubble">
        <div class="bubble-original">${escapeHtml(m.original)}</div>
        <div class="bubble-translation">${escapeHtml(m.translation)}</div>
        <div class="bubble-actions">
          <button class="bubble-link" onclick="speakMsg(${i})">Speak</button>
          <button class="bubble-link" onclick="copyMsg(${i})">Copy</button>
        </div>
      </div>
    </div>
  `).join('');
  chatViewport.scrollTop = chatViewport.scrollHeight;
}

let audio = null;
window.speakMsg = (i) => {
  const m = conversationHistory[i];
  const l = m.targetLangCode.startsWith('zh') ? m.targetLangCode : m.targetLangCode.split('-')[0];
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(m.translation)}&tl=${l}&client=tw-ob`;
  if (audio) audio.pause();
  audio = new Audio(url);
  audio.play();
};

window.copyMsg = (i) => {
  const m = conversationHistory[i];
  navigator.clipboard.writeText(`[${m.role}] ${m.original} -> ${m.translation}`);
};

clearBtn.addEventListener('click', () => { conversationHistory = []; renderChat(); });

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

populateLanguages();
