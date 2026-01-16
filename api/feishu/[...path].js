export default async function handler(req, res) {
    // 获取路径参数
    const { path } = req.query;
    const feishuPath = Array.isArray(path) ? path.join('/') : path;
    const targetUrl = `https://open.feishu.cn/${feishuPath}`;

    try {
        // 转发请求到飞书
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { Authorization: req.headers.authorization })
            },
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) })
        });

        const data = await response.json();

        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Feishu proxy error:', error);
        res.status(500).json({ error: 'Proxy failed', message: error.message });
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
