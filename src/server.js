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

// 常用顶级域名列表
const POPULAR_TLDS = [
    'com', 'net', 'org', 'io', 'ai', 'app',
    'dev', 'co', 'me', 'biz', 'info', 'xyz',
    'online', 'site', 'top', 'live', 'link'
];

// 检查域名可用性和销售状态
async function checkDomainStatus(baseName) {
    const results = {};
    
    // 检查每个TLD
    await Promise.all(
        POPULAR_TLDS.map(async (tld) => {
            const domain = `${baseName}.${tld}`;
            try {
                // 检查whois信息
                const whoisResult = await whoisDomain(domain);
                
                // 检查域名市场
                const marketplaces = await checkMarketplaces(domain);
                const isForSale = Object.values(marketplaces).some(v => v);
                
                results[tld] = {
                    status: whoisResult ? 'registered' : 'available',
                    forSale: isForSale,
                    whois: whoisResult
                };
            } catch (error) {
                results[tld] = {
                    status: 'error',
                    error: error.message
                };
            }
        })
    );

    return results;
}

// 检查域名市场
async function checkMarketplaces(domain) {
    const marketplaces = {
        afternic: {
            url: `https://api.afternic.com/v3/domain/${domain}`,
            headers: { 'Accept': 'application/json' }
        },
        sedo: {
            url: `https://api.sedo.com/api/v1/domain/${domain}`,
            headers: { 'Accept': 'application/json' }
        },
        dan: {
            url: `https://api.dan.com/v1/domains/${domain}/status`,
            headers: { 'Accept': 'application/json' }
        },
        godaddy: {
            url: `https://api.godaddy.com/v1/domains/available?domain=${domain}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
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
                
                // 检查响应状态和内容
                if (response.ok) {
                    const data = await response.text();
                    // 如果响应包含特定的关键词，说明域名可能在售
                    results[market] = data.toLowerCase().includes('for sale') || 
                                    data.toLowerCase().includes('available') ||
                                    data.toLowerCase().includes('price');
                } else {
                    results[market] = false;
                }
            } catch (error) {
                console.error(`Error checking ${market}:`, error);
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

// API endpoint for domain WHOIS with status check
app.get('/api/domain/:domain', async (req, res) => {
    try {
        const domain = req.params.domain;
        const baseName = domain.split('.')[0];
        
        // 获取所有TLD的状态
        const domainStatus = await checkDomainStatus(baseName);
        
        // 获取查询域名的详细whois信息
        const whoisResult = await whoisDomain(domain);

        res.json({
            query: domain,
            whois: whoisResult,
            tldStatus: domainStatus
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