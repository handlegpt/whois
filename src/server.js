import express from 'express';
import { whoisDomain, whoisIp, whoisAsn } from '../dist/whoiser.js';

const app = express();
const port = process.env.PORT || 80;

app.use(express.json());

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