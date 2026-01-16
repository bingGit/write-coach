// Token cache (in-memory, resets on cold start)
let cachedToken = null;
let tokenExpireAt = 0;

async function getTenantAccessToken() {
    // Return cached token if valid
    if (cachedToken && Date.now() < tokenExpireAt) {
        return cachedToken;
    }

    // Read credentials from server-side env (NOT exposed to frontend)
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
        throw new Error('Feishu credentials not configured on server');
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });

    if (!response.ok) {
        throw new Error(`Auth Failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`Auth Error: ${data.msg}`);
    }

    cachedToken = data.tenant_access_token;
    tokenExpireAt = Date.now() + (data.expire - 300) * 1000; // Buffer 5 mins
    return cachedToken;
}

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Extract the path from the URL
    const url = new URL(req.url, `https://${req.headers.host}`);
    const feishuPath = url.pathname.replace('/feishu-api/', '').replace('/api/feishu/', '');

    let targetPath = feishuPath;
    if (!targetPath || targetPath === '') {
        const originalPath = req.headers['x-vercel-proxy-url'] || req.url;
        const match = originalPath.match(/feishu-api\/(.+)/);
        if (match) {
            targetPath = match[1];
        }
    }

    try {
        // Special handling for auth endpoint - use server-side credentials
        if (targetPath.includes('auth/v3/tenant_access_token')) {
            const token = await getTenantAccessToken();
            return res.status(200).json({
                code: 0,
                tenant_access_token: token,
                expire: 7200
            });
        }

        // For all other endpoints, proxy with server-obtained token
        const token = await getTenantAccessToken();
        const targetUrl = `https://open.feishu.cn/${targetPath}${url.search}`;
        console.log('Proxying to:', targetUrl);

        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        // Add body for POST requests (exclude auth-related body content)
        if (req.method === 'POST' && req.body) {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            // Remove any accidentally included credentials
            delete body.app_id;
            delete body.app_secret;
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Feishu proxy error:', error);
        res.status(500).json({ error: 'Proxy failed', message: error.message });
    }
}
