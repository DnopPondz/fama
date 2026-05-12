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
