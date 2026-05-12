module.exports = async (req, res) => {
  const allowAi = String(process.env.ALLOW_AI || '').trim() === '1';
  const hasApiKey = Boolean((process.env.GEMINI_API_KEY || '').trim());
  const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  return res.end(JSON.stringify({ allowAi, hasApiKey, model }));
};

