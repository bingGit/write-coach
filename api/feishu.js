export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    // Extract the path from the URL (everything after /feishu-api/)
    const url = new URL(req.url, `https://${req.headers.host}`);
    const feishuPath = url.pathname.replace('/feishu-api/', '').replace('/api/feishu/', '');

    // If path is empty, try to get from query or referer
    let targetPath = feishuPath;
    if (!targetPath || targetPath === '') {
        // Try to extract from the original request URL
        const originalPath = req.headers['x-vercel-proxy-url'] || req.url;
        const match = originalPath.match(/feishu-api\/(.+)/);
        if (match) {
            targetPath = match[1];
        }
    }

    const targetUrl = `https://open.feishu.cn/${targetPath}`;
    console.log('Proxying to:', targetUrl);

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add Authorization header if present
        if (req.headers.authorization) {
            fetchOptions.headers['Authorization'] = req.headers.authorization;
        }

        // Add body for POST requests
        if (req.method === 'POST' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        const data = await response.json();

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Feishu proxy error:', error);
        res.status(500).json({ error: 'Proxy failed', message: error.message, targetUrl });
    }
}
