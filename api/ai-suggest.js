module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.statusCode = 405;
      return res.end('Method Not Allowed');
    }

    const allowAi = String(process.env.ALLOW_AI || '').trim() === '1';
    if (!allowAi) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'AI is disabled. Set ALLOW_AI=1.' }));
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY.' }));
    }

    const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

    const bodyRaw = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
    });
    const body = bodyRaw ? JSON.parse(bodyRaw) : {};

    const names = Array.isArray(body?.names) ? body.names : [];
    const cleanedNames = names
      .map((n) => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean)
      .slice(0, 200);

    if (cleanedNames.length === 0) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      return res.end(JSON.stringify({ suggestions: {} }));
    }

    const prompt = [
      'You are a professional pharmacist in Thailand.',
      'I have a list of drugs with names.',
      'Please suggest the current average retail selling price (Standard Thai Pharmacy Price) in THB for each.',
      'Return ONLY a JSON object where keys are the drug names and values are the suggested retail price as a string.',
      `Items: ${cleanedNames.join(', ')}`,
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    const result = await aiRes.json();
    if (!aiRes.ok) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = aiRes.status;
      return res.end(JSON.stringify({ error: 'Gemini API error', details: result }));
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let suggestions = {};
    try {
      suggestions = JSON.parse(text);
    } catch {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Failed to parse Gemini JSON response', raw: text }));
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    return res.end(JSON.stringify({ suggestions }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'AI suggest failed' }));
  }
};

