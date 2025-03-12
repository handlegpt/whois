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
        afternic: {
            url: `https://api.afternic.com/v2/domain/available/${domain}`,
            headers: { 'Accept': 'application/json' }
        },
        sedo: {
            url: `https://sedo.com/api/market.php?domain=${domain}&language=us`,
            headers: { 'Accept': 'application/json' }
        },
        dan: {
            url: `https://api.dan.com/v1/domains/${domain}/check`,
            headers: { 'Accept': 'application/json' }
        }
    };

    const results = {};
    
    await Promise.all(
        Object.entries(marketplaces).map(async ([market, config]) => {
            try {
                const response = await fetch(config.url, {
                    method: 'GET',
                    headers: config.headers
                });
                const data = await response.json();
                
                // 根据不同平台的API响应格式判断
                switch(market) {
                    case 'afternic':
                        results[market] = data.status === 'available';
                        break;
                    case 'sedo':
                        results[market] = data.isForSale === true;
                        break;
                    case 'dan':
                        results[market] = data.available === true;
                        break;
                    default:
                        results[market] = false;
                }
            } catch (error) {
                console.error(`Error checking ${market}:`, error);
                results[market] = false;
            }
        })
    );

    // 添加额外的检查结果
    try {
        // 检查是否在GoDaddy拍卖中
        const gdResponse = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${domain}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const gdData = await gdResponse.json();
        results.godaddy = gdData.forSale === true;
    } catch (error) {
        console.error('Error checking GoDaddy:', error);
        results.godaddy = false;
    }

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