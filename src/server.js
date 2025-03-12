import express from 'express';
import { whoisDomain, whoisIp, whoisAsn } from '../dist/whoiser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 检查域名市场
async function checkMarketplaces(domain) {
    const marketplaces = {
        afternic: `https://www.afternic.com/domain/${domain}`,
        sedo: `https://sedo.com/search/?keyword=${domain}`,
        dan: `https://dan.com/buy-domain/${domain}`,
        godaddy: `https://www.godaddy.com/domain-auctions/${domain}`,
    };

    const results = {};
    
    await Promise.all(
        Object.entries(marketplaces).map(async ([market, url]) => {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                results[market] = response.status === 200;
            } catch (error) {
                results[market] = false;
            }
        })
    );

    return results;
}

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint for domain WHOIS with marketplace check
app.get('/api/domain/:domain', async (req, res) => {
    try {
        const [whoisResult, marketplaces] = await Promise.all([
            whoisDomain(req.params.domain),
            checkMarketplaces(req.params.domain)
        ]);

        res.json({
            whois: whoisResult,
            marketplaces
        });
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