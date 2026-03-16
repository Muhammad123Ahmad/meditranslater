export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, sourceLang, targetLang, mode } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  let systemPrompt = "";
  let userPrompt = "";

  if (mode === 'transliterate') {
    // Mode for converting Hindi script (Devanagari) to Urdu script (Arabic)
    systemPrompt = 'You are an exact transliteration engine. Convert any Hindi text (Devanagari script) into Urdu text (Arabic script). Output ONLY the Urdu script without any explanations, notes, or English words.';
    userPrompt = text;
  } else {
    // Default translation mode
    systemPrompt = `You are an expert translator and medical interpreter.
Your only task is to accurately translate the user's input text from ${sourceLang} into ${targetLang}.

CRITICAL RULES:
1. The output MUST BE strictly in ${targetLang}. Do NOT output English unless the target language is English.
2. Preserve ALL medical terminology accurately (diagnoses, medications, procedures, dosages, anatomical terms).
3. Keep the tone natural and conversational.
4. Output ONLY the translated text in ${targetLang} — no explanations, notes, conversational filler, or extra text.`;
    userPrompt = `Translate this text from ${sourceLang} to ${targetLang}:\n\n${text}`;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
