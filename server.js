const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Serverless fix: Use Vercel's writable /tmp directory for data persistence, otherwise use local directory
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const DATA_FILE = isVercel ? path.join('/tmp', 'data.json') : path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to safely ensure the data file exists
const ensureDataFileExists = () => {
    if (!fs.existsSync(DATA_FILE)) {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
        } catch (e) {
            console.error("Failed to initialize data file:", e);
        }
    }
};

// Your GET API Endpoint
app.get('/api/data', (req, res) => {
    ensureDataFileExists();
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Read error:", err);
            return res.json({});
        }
        try {
            res.setHeader('Content-Type', 'application/json');
            res.send(data || '{}');
        } catch (parseError) {
            res.json({});
        }
    });
});

// Your POST API Endpoint
app.post('/api/data', (req, res) => {
    try {
        const body = JSON.stringify(req.body);
        fs.writeFile(DATA_FILE, body, 'utf8', err => {
            if (err) {
                console.error("Write error:", err);
                return res.status(500).json({ error: 'Failed to write data' });
            }
            res.json({ success: true });
        });
    } catch (err) {
        console.error("Server crash prevented:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fallback route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running locally at http://localhost:${PORT}`);
    });
}