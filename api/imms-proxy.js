/**
 * IMMS API Proxy for Vercel Serverless Functions
 * Bypasses CORS and sets required headers (User-Agent) for IREPS integration.
 */
export default async function handler(req, res) {
    const { path } = req.query;
    
    // Construct the actual target URL
    // Expected path like: authenticate OR purchase/getPOData
    const targetUrl = `https://ireps.gov.in/immsapi/${path}`;

    console.log(`[Vercel Proxy] Forwarding to: ${targetUrl}`);

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PostmanRuntime/7.43.0', // Essential for IREPS
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
}
