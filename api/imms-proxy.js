/**
 * IMMS API Proxy for Vercel Serverless Functions
 * Bypasses CORS and sets required headers (User-Agent) for IREPS integration.
 * Using CommonJS (module.exports) for maximum compatibility.
 */
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { path } = req.query;
    
    if (!path) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Construct the actual target URL
    const targetUrl = `https://ireps.gov.in/immsapi/${path}`;

    console.log(`[Vercel Proxy] Forwarding ${req.method} to: ${targetUrl}`);

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PostmanRuntime/7.43.0',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        };

        // Forward Authorization header if present
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        // Forward body for POST/PUT requests
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.text();

        // Forward status code
        res.status(response.status);

        // Try to parse as JSON if possible
        try {
            const jsonData = JSON.parse(data);
            res.setHeader('Content-Type', 'application/json');
            return res.json(jsonData);
        } catch (e) {
            // Return raw text if not JSON
            res.setHeader('Content-Type', response.headers.get('content-type') || 'text/plain');
            return res.send(data);
        }
    } catch (error) {
        console.error('[Vercel Proxy Error]:', error);
        return res.status(500).json({ 
            status: 'ERROR', 
            message: 'Internal Proxy Error', 
            error: error.message 
        });
    }
};
