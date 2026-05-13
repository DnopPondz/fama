const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JSON_PATH = path.join(__dirname, 'drug_list_with_want.json');
const DIST_PATH = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
});

function sanitizeDrugObject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out = {};
  for (const [category, drugs] of Object.entries(input)) {
    const cleanCategory = String(category || '').trim();
    if (!cleanCategory || cleanCategory.length > 80) continue;
    if (!Array.isArray(drugs)) continue;

    out[cleanCategory] = drugs
      .filter((d) => d && typeof d === 'object' && !Array.isArray(d))
      .map((d) => ({
        name: String(d.name || '').trim().slice(0, 120),
        want: String(d.want ?? '').trim().slice(0, 40),
        profit: Number.isFinite(Number(d.profit)) ? Number(d.profit) : 0
      }))
      .filter((d) => d.name);
  }
  return out;
}

app.get('/api/drugs', (_req, res) => {
  fs.readFile(JSON_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'ไม่สามารถอ่านไฟล์ได้' });
    const cleanData = data.replace(/: NaN/g, ': 0');
    return res.type('application/json').send(cleanData);
  });
});

app.post('/api/drugs', (req, res) => {
  const safePayload = sanitizeDrugObject(req.body);
  if (!safePayload) return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });

  fs.writeFile(JSON_PATH, JSON.stringify(safePayload, null, 2), 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'ไม่สามารถบันทึกไฟล์ได้' });
    return res.json({ message: 'บันทึกสำเร็จ' });
  });
});

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get('/{*any}', (_req, res) => res.sendFile(path.join(DIST_PATH, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
