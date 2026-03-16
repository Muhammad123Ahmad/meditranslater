export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, sourceLang, targetLang, mode, role } = req.body;

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
    // Default translation mode with Role Context
    const speakerRole = role === 'provider' ? 'Healthcare Provider (Doctor/Nurse)' : 'Patient';
    
    systemPrompt = `You are an expert medical translator and interpreter. 
The current speaker is: ${speakerRole}.

CRITICAL RULES:
1. Translate from ${sourceLang} to ${targetLang}.
2. If Provider is speaking: Use professional, clinical, and authoritative tone. Use precise medical terminology.
3. If Patient is speaking: Use descriptive, natural, and symptom-focused language.
4. Output MUST BE strictly in ${targetLang}.
5. Output ONLY the translated text — no explanations, notes, or extra text.`;
    
    userPrompt = text;
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
