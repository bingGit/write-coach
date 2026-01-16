import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Token cache for local dev
let cachedToken: string | null = null;
let tokenExpireAt = 0;

async function getToken(appId: string, appSecret: string): Promise<{ code: number; tenant_access_token?: string; expire?: number }> {
  // Return cached token if valid
  if (cachedToken && Date.now() < tokenExpireAt) {
    return { code: 0, tenant_access_token: cachedToken, expire: 7200 };
  }

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });

  const data = await response.json() as { code: number; tenant_access_token?: string; expire?: number };
  if (data.code === 0 && data.tenant_access_token) {
    cachedToken = data.tenant_access_token;
    tokenExpireAt = Date.now() + ((data.expire || 7200) - 300) * 1000;
  }
  return data;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'feishu-auth-middleware',
        configureServer(server) {
          // Middleware to intercept auth requests BEFORE proxy
          server.middlewares.use('/feishu-api/open-apis/auth', async (_req, res) => {
            try {
              const data = await getToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Token fetch failed' }));
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        '/feishu-api': {
          target: 'https://open.feishu.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/feishu-api/, '')
        }
      }
    }
  }
})
