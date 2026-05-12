const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.')); // เปิดให้เข้าถึงไฟล์ index.html ในโฟลเดอร์เดียวกัน

// โหลด .env แบบเบาๆ (Node/Express ไม่อ่าน .env ให้อัตโนมัติ)
// จะไม่ override ค่า env ที่ถูกตั้งไว้แล้วในระบบ
function loadDotEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return;
        const raw = fs.readFileSync(envPath, 'utf8');
        raw.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eq = trimmed.indexOf('=');
            if (eq === -1) return;
            const key = trimmed.slice(0, eq).trim();
            let value = trimmed.slice(eq + 1).trim();
            if (!key) return;
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (process.env[key] == null || process.env[key] === '') {
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.warn('Failed to load .env:', e?.message || e);
    }
}
loadDotEnv();

const JSON_PATH = path.join(__dirname, 'drug_list_with_want.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ALLOW_AI = (process.env.ALLOW_AI || '').trim() === '1';

// API สำหรับดึงข้อมูลจากไฟล์ JSON
app.get('/api/drugs', (req, res) => {
    fs.readFile(JSON_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถอ่านไฟล์ได้' });
        }
        // แก้ไขค่า NaN ที่อาจทำให้ JSON พังก่อนส่งไปหน้าเว็บ
        const cleanData = data.replace(/: NaN/g, ': 0');
        res.send(cleanData);
    });
});

// สถานะการตั้งค่า AI (ใช้ตรวจ debug หน้าเว็บ)
app.get('/api/ai-status', (req, res) => {
    res.json({
        allowAi: ALLOW_AI,
        hasApiKey: Boolean(GEMINI_API_KEY),
        model: GEMINI_MODEL
    });
});

// API สำหรับให้ AI ช่วยแนะนำราคาขาย (ไม่เปิดเผย API key ฝั่ง client)
app.post('/api/ai-suggest', async (req, res) => {
    try {
        if (!ALLOW_AI) {
            return res.status(403).json({ error: 'AI is disabled. Set ALLOW_AI=1 and restart server.' });
        }
        if (!GEMINI_API_KEY) {
            return res.status(400).json({ error: 'Missing GEMINI_API_KEY. Set env var before starting server.' });
        }

        const names = Array.isArray(req.body?.names) ? req.body.names : [];
        const cleanedNames = names
            .map(n => (typeof n === 'string' ? n.trim() : ''))
            .filter(Boolean)
            .slice(0, 200); // กัน prompt ยาวเกินไป

        if (cleanedNames.length === 0) {
            return res.json({ suggestions: {} });
        }

        const prompt = [
            "You are a professional pharmacist in Thailand.",
            "I have a list of drugs with names.",
            "Please suggest the current average retail selling price (Standard Thai Pharmacy Price) in THB for each.",
            "Return ONLY a JSON object where keys are the drug names and values are the suggested retail price as a string.",
            `Items: ${cleanedNames.join(', ')}`
        ].join('\n');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
        const aiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
            })
        });

        const result = await aiRes.json();
        if (!aiRes.ok) {
            return res.status(aiRes.status).json({ error: 'Gemini API error', details: result });
        }

        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        let suggestions = {};
        try {
            suggestions = JSON.parse(text);
        } catch {
            return res.status(500).json({ error: 'Failed to parse Gemini JSON response', raw: text });
        }

        return res.json({ suggestions });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'AI suggest failed' });
    }
});

// API สำหรับบันทึกข้อมูลทับลงในไฟล์ JSON
app.post('/api/drugs', (req, res) => {
    const newData = JSON.stringify(req.body, null, 4);
    fs.writeFile(JSON_PATH, newData, (err) => {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถบันทึกไฟล์ได้' });
        }
        res.json({ message: 'บันทึกสำเร็จ' });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมใช้งานที่ http://localhost:${PORT}`);
});
