const express = require('express');
const Docker = require('dockerode');
const { runCodeInContainer } = require('./languages/runner');

const app = express();
const docker = new Docker();
app.use(express.json());

app.post('/execute', async (req, res) => {
    const { language, code, testCases } = req.body;
    try {
        const result = await runCodeInContainer(docker, language, code, testCases);
        res.json(result);
    } catch (error) {
        res.status(500).json({ verdict: 'Error', output: error.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Judge engine listening on port ${PORT}`);
});
