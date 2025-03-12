import express from 'express';
import { whoisDomain, whoisIp, whoisAsn } from '../dist/whoiser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint for domain WHOIS
app.get('/api/domain/:domain', async (req, res) => {
    try {
        const result = await whoisDomain(req.params.domain);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for IP WHOIS
app.get('/api/ip/:ip', async (req, res) => {
    try {
        const result = await whoisIp(req.params.ip);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for ASN WHOIS
app.get('/api/asn/:asn', async (req, res) => {
    try {
        const result = await whoisAsn(req.params.asn);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 