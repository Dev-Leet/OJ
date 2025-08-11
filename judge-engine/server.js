// /judge-engine/server.js
const express = require('express');
const cors = require('cors');
const { executeCode } = require('./judge');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/execute', async (req, res) => {
  const { language, code, input } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: 'Language and code are required.' });
  }

  try {
    const output = await executeCode(language, code, input || '');
    res.json({ output });
  } catch (error) {
    res.status(500).json({ error: error.stderr || error.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Judge engine listening on port ${PORT}`);
});

