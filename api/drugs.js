const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(process.cwd(), 'drug_list_with_want.json');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const data = fs.readFileSync(JSON_PATH, 'utf8');
      const cleanData = data.replace(/: NaN/g, ': 0');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      return res.end(cleanData);
    }

    if (req.method === 'POST') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 405;
      return res.end(
        JSON.stringify(
          {
            error:
              'Saving to JSON file is not supported on Vercel (read-only/ephemeral filesystem). Use a database or storage instead.',
          },
          null,
          2
        )
      );
    }

    res.setHeader('Allow', 'GET, POST');
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Failed to read JSON' }));
  }
};
