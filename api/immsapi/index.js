/**
 * IMMS API Proxy for Azure Functions (Static Web Apps API)
 * Bypasses CORS and sets required headers (Host, User-Agent, etc) for IREPS integration.
 * Mounted at /api/immsapi/{*path}
 */
module.exports = async function (context, req) {
    const corsHeaders = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
        'Access-Control-Allow-Headers': 'Accept, Content-Type, Authorization, X-Requested-With'
    };

    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {}
        };
        return;
    }

    // path is captured via the route parameter {*path}
    const path = context.bindingData.path;
    
    if (!path) {
        context.res = {
            status: 400,
            headers: corsHeaders,
            body: { 
                error: 'Missing path parameter',
                diag: {
                    url: req.url,
                    method: req.method,
                    bindingData: context.bindingData
                }
            }
        };
        return;
    }

    // Construct the actual target URL
    const targetUrl = `https://ireps.gov.in/immsapi/${path}`;
    context.log(`[Azure Proxy] Forwarding ${req.method} to: ${targetUrl}`);

    try {
        const headers = {
            'Host': 'ireps.gov.in',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PostmanRuntime/7.43.0',
            'Origin': 'https://ireps.gov.in',
            'Referer': 'https://ireps.gov.in/immsapi/home',
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

        // Try to parse as JSON if possible
        try {
            const jsonData = JSON.parse(data);
            context.res = {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: jsonData
            };
        } catch (e) {
            // If not JSON, return it wrapped in a JSON object for the frontend
            context.res = {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: { 
                    status: 'SUCCESS_RAW',
                    targetUrl: targetUrl,
                    rawData: data,
                    token: data 
                }
            };
        }
    } catch (error) {
        context.log.error('[Azure Proxy Error]:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: { 
                status: 'ERROR', 
                message: 'Internal Proxy Error', 
                error: error.message 
            }
        };
    }
};
