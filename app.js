/* ============================================================
   MEDITRANSLATE — APP.JS
   Speech Recognition → Gemini Translation → Speech Synthesis
   ============================================================ */

// ── Language definitions ──────────────────────────────────────
const LANGUAGES = [
  { code: 'en-US',       name: 'English',             bcp47: 'en'  },
  { code: 'ur-PK',       name: 'Urdu',                bcp47: 'ur'  },
  { code: 'ar-SA',       name: 'Arabic',              bcp47: 'ar'  },
  { code: 'es-ES',       name: 'Spanish',             bcp47: 'es'  },
  { code: 'fr-FR',       name: 'French',              bcp47: 'fr'  },
  { code: 'de-DE',       name: 'German',              bcp47: 'de'  },
  { code: 'zh-CN',       name: 'Chinese (Mandarin)',  bcp47: 'zh'  },
  { code: 'hi-IN',       name: 'Hindi',               bcp47: 'hi'  },
  { code: 'pt-BR',       name: 'Portuguese',          bcp47: 'pt'  },
  { code: 'ru-RU',       name: 'Russian',             bcp47: 'ru'  },
  { code: 'ja-JP',       name: 'Japanese',            bcp47: 'ja'  },
  { code: 'ko-KR',       name: 'Korean',              bcp47: 'ko'  },
  { code: 'it-IT',       name: 'Italian',             bcp47: 'it'  },
  { code: 'tr-TR',       name: 'Turkish',             bcp47: 'tr'  },
  { code: 'fa-IR',       name: 'Persian (Farsi)',     bcp47: 'fa'  },
  { code: 'bn-BD',       name: 'Bengali',             bcp47: 'bn'  },
  { code: 'sw-KE',       name: 'Swahili',             bcp47: 'sw'  },
  { code: 'nl-NL',       name: 'Dutch',               bcp47: 'nl'  },
  { code: 'pl-PL',       name: 'Polish',              bcp47: 'pl'  },
  { code: 'vi-VN',       name: 'Vietnamese',          bcp47: 'vi'  },
  { code: 'tl-PH',       name: 'Filipino (Tagalog)',  bcp47: 'tl'  },
  { code: 'ms-MY',       name: 'Malay',               bcp47: 'ms'  },
  { code: 'id-ID',       name: 'Indonesian',          bcp47: 'id'  },
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
const originalTextEl     = document.getElementById('originalText');
const translatedTextEl   = document.getElementById('translatedText');
const sourceLangBadge    = document.getElementById('sourceLangBadge');
const targetLangBadge    = document.getElementById('targetLangBadge');
const copyOriginalBtn    = document.getElementById('copyOriginal');
const copyTranslationBtn = document.getElementById('copyTranslation');
const speakBtn           = document.getElementById('speakBtn');
const translatingInd     = document.getElementById('translatingIndicator');
const clearBtn           = document.getElementById('clearBtn');

// ── State ─────────────────────────────────────────────────────
let isRecording    = false;
let recognition    = null;
let finalTranscript = '';
let currentTranslation = '';

// ── Populate language dropdowns ───────────────────────────────
function populateLanguages() {
  LANGUAGES.forEach(lang => {
    const opt1 = new Option(lang.name, lang.code);
    const opt2 = new Option(lang.name, lang.code);
    sourceLangEl.appendChild(opt1);
    targetLangEl.appendChild(opt2);
  });
  // Defaults: English → Urdu
  sourceLangEl.value = 'en-US';
  targetLangEl.value = 'ur-PK';
  updateBadges();
}

function updateBadges() {
  const srcName = LANGUAGES.find(l => l.code === sourceLangEl.value)?.name || '';
  const tgtName = LANGUAGES.find(l => l.code === targetLangEl.value)?.name || '';
  sourceLangBadge.textContent = srcName;
  targetLangBadge.textContent = tgtName;
}

sourceLangEl.addEventListener('change', () => {
  updateBadges();
  // If user changes language while recording, restart to apply new language
  if (isRecording) {
    stopRecording(false);
    setTimeout(startRecording, 300);
  }
});

targetLangEl.addEventListener('change', updateBadges);

// ── Swap languages ────────────────────────────────────────────
swapBtn.addEventListener('click', () => {
  const tmp = sourceLangEl.value;
  sourceLangEl.value = targetLangEl.value;
  targetLangEl.value = tmp;
  updateBadges();

  // Also swap visible text between panels
  const origText = finalTranscript;
  const transText = currentTranslation;
  if (origText || transText) {
    setOriginalText(transText);
    setTranslatedText(origText);
    finalTranscript = transText;
    currentTranslation = origText;
  }

  // Restart recording if active so new input language applies
  if (isRecording) {
    stopRecording(false);
    setTimeout(startRecording, 300);
  }
});

// ── Browser check ─────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  browserWarning.classList.remove('hidden');
  micBtn.disabled = true;
  micStatus.textContent = 'Speech recognition not supported';
}

// ── Microphone / Recording ────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (isRecording) stopRecording();
  else startRecording();
});

function startRecording() {
  if (!SpeechRecognition) return;

  recognition = new SpeechRecognition();
  
  // Handle specific languages where Chrome speech recognition is finicky
  let targetRecLang = sourceLangEl.value;
  
  // 1. Urdu workaround: Spoken Urdu and Hindi overlap significantly, and Chrome's speech engine
  // natively supports 'hi-IN' on almost all Windows PCs without requiring extra language packs.
  if (targetRecLang === 'ur-PK') {
    targetRecLang = 'hi-IN';
  }
  
  // 2. Chinese workaround: Standard zh-CN is usually most reliable for Mandarin.
  if (targetRecLang.startsWith('zh')) {
    targetRecLang = 'zh-CN';
  }
  
  recognition.lang = targetRecLang;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  finalTranscript = '';

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('recording');
    pulseRing.classList.add('active');
    micIcon.classList.add('hidden');
    stopIcon.classList.remove('hidden');
    micStatus.textContent = 'Listening… speak now';
    micStatus.className = 'mic-status active';
    setOriginalText('');
  };

  recognition.onresult = (event) => {
    let interim = '';
    finalTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    // Display: final in normal text, interim in italic
    originalTextEl.innerHTML =
      (finalTranscript ? `<span>${escapeHtml(finalTranscript.trim())}</span>` : '') +
      (interim ? `<span class="interim-text"> ${escapeHtml(interim)}</span>` : '');
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    let msg = 'Microphone error. Please try again.';
    if (event.error === 'not-allowed')  msg = '⚠️ Microphone access denied. Please allow mic permission.';
    if (event.error === 'no-speech')    msg = 'No speech detected. Try again.';
    if (event.error === 'network')      msg = 'Network error during recognition.';
    micStatus.textContent = msg;
    micStatus.className = 'mic-status';
    stopRecording(false);
  };

  recognition.onend = () => {
    if (isRecording) {
      // Auto-restart if user hasn't manually stopped
      recognition.start();
    }
  };

  recognition.start();
}

async function stopRecording(doTranslate = true) {
  isRecording = false;
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
  }
  micBtn.classList.remove('recording');
  pulseRing.classList.remove('active');
  micIcon.classList.remove('hidden');
  stopIcon.classList.add('hidden');

  let text = finalTranscript.trim();
  if (doTranslate && text) {
    micStatus.textContent = 'Processing…';
    micStatus.className = 'mic-status';

    // If we used the Hindi fallback for Urdu, transliterate the Hindi text to Urdu script first
    if (sourceLangEl.value === 'ur-PK') {
      micStatus.textContent = 'Formatting Urdu script…';
      try {
        const translitResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            mode: 'transliterate'
          })
        });

        if (translitResponse.ok) {
          const tData = await translitResponse.json();
          const urduText = tData?.choices?.[0]?.message?.content?.trim();
          if (urduText) {
            text = urduText;
            finalTranscript = text; // Update the transcript variable
            setOriginalText(text);  // Update the UI
          }
        }
      } catch (e) {
        console.error('Transliteration failed:', e);
      }
    }

    translateText(text);
  } else {
    micStatus.textContent = text ? 'Ready. Tap to record again.' : 'No speech captured. Try again.';
    micStatus.className = 'mic-status';
  }
}

// ── Text helpers ──────────────────────────────────────────────
function setOriginalText(text) {
  if (!text) {
    originalTextEl.innerHTML = '<p class="placeholder-text">Your speech will appear here in real-time…</p>';
  } else {
    originalTextEl.innerHTML = `<span>${escapeHtml(text)}</span>`;
  }
}

function setTranslatedText(text) {
  if (!text) {
    translatedTextEl.innerHTML = '<p class="placeholder-text">Translation will appear here…</p>';
  } else {
    translatedTextEl.innerHTML = `<span>${escapeHtml(text)}</span>`;
  }
  currentTranslation = text || '';
  speakBtn.disabled = !text;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Groq Translation ─────────────────────────────────────────
async function translateText(text) {
  const targetLang = LANGUAGES.find(l => l.code === targetLangEl.value)?.name || targetLangEl.value;
  const sourceLang = LANGUAGES.find(l => l.code === sourceLangEl.value)?.name || sourceLangEl.value;

  translatingInd.classList.remove('hidden');
  speakBtn.disabled = true;
  setTranslatedText('');

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        sourceLang: sourceLang,
        targetLang: targetLang
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const translated = data?.choices?.[0]?.message?.content?.trim();

    if (!translated) throw new Error('Empty response from Groq.');

    setTranslatedText(translated);
    micStatus.textContent = 'Translation complete. Tap to record again.';
    micStatus.className = 'mic-status success';

  } catch (err) {
    console.error('Translation error:', err);
    setTranslatedText('');
    translatedTextEl.innerHTML = `<p style="color:var(--danger)">⚠️ Translation failed: ${escapeHtml(err.message)}</p>`;
    micStatus.textContent = 'Translation error. Check console for details.';
    micStatus.className = 'mic-status';
  } finally {
    translatingInd.classList.add('hidden');
  }
}

// ── Text-to-Speech ────────────────────────────────────────────
let currentAudio = null;

speakBtn.addEventListener('click', () => {
  if (!currentTranslation) return;
  
  // Clean up any ongoing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    speakBtn.style.opacity = '';
    speakBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak';
    return;
  }

  const targetCode = targetLangEl.value;
  // Get main language code (e.g. 'ur' from 'ur-PK', 'zh' from 'zh-CN')
  // For Chinese, we need to pass 'zh-CN' or 'zh-TW' to the TTS URL
  const lang = targetCode.startsWith('zh') ? targetCode : targetCode.split('-')[0];
  
  // Use Google's reliable TTS API with tw-ob client to bypass localhost CORS blocks
  const textEnc = encodeURIComponent(currentTranslation);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${textEnc}&tl=${lang}&client=tw-ob`;
  
  currentAudio = new Audio(url);
  
  speakBtn.style.opacity = '0.7';
  speakBtn.innerHTML = 'Speaking...';

  const resetBtn = () => {
    speakBtn.style.opacity = '';
    speakBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak';
    currentAudio = null;
  };

  currentAudio.onended = resetBtn;
  currentAudio.onerror = () => {
    console.error('Audio TTS playback failed');
    speakBtn.innerHTML = 'Speak Error';
    setTimeout(resetBtn, 2000);
  };

  currentAudio.play().catch(e => {
    console.error('Audio play blocked:', e);
    speakBtn.innerHTML = 'Speak Error';
    setTimeout(resetBtn, 2000);
  });
});

// ── Copy buttons ──────────────────────────────────────────────
function copyToClipboard(text, btn) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 2000);
  });
}

copyOriginalBtn.addEventListener('click', () => copyToClipboard(finalTranscript.trim(), copyOriginalBtn));
copyTranslationBtn.addEventListener('click', () => copyToClipboard(currentTranslation, copyTranslationBtn));

// ── Clear All ─────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  if (isRecording) stopRecording(false);
  finalTranscript = '';
  currentTranslation = '';
  setOriginalText('');
  setTranslatedText('');
  micStatus.textContent = 'Tap to start recording';
  micStatus.className = 'mic-status';
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    speakBtn.style.opacity = '';
    speakBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Speak';
  }
});

// ── Init ──────────────────────────────────────────────────────
populateLanguages();
speakBtn.disabled = true;
