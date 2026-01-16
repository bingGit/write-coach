interface FeishuConfig {
    appId: string;
    appSecret: string;
    baseId: string;
    tableId: string;
}

interface SyncRecord {
    original: string;
    refined: string;
    style: string;
    date: string; // ISO 8601 or timestamp
}

export class FeishuService {
    private config: FeishuConfig;
    private token: string | null = null;
    private tokenExpireAt: number = 0;

    constructor(config: FeishuConfig) {
        this.config = config;
    }

    private async getTenantAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpireAt) {
            return this.token;
        }

        const response = await fetch('/feishu-api/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: this.config.appId,
                app_secret: this.config.appSecret
            })
        });

        if (!response.ok) {
            throw new Error(`Auth Failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Auth Error: ${data.msg}`);
        }

        this.token = data.tenant_access_token;
        this.tokenExpireAt = Date.now() + (data.expire - 300) * 1000; // Buffer 5 mins
        return this.token!;
    }

    async syncRecord(record: SyncRecord): Promise<void> {
        const token = await this.getTenantAccessToken();
        const { baseId, tableId } = this.config;

        const fields = {
            '原句': record.original,
            '润色': record.refined,
            '风格': record.style,
            '日期': new Date(record.date).getTime() // Convert to timestamp for Date field
        };

        const response = await fetch(`/feishu-api/open-apis/bitable/v1/apps/${baseId}/tables/${tableId}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fields: fields
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sync Failed: ${errorText}`);
        }

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Sync Error: ${data.msg}`);
        }
    }
}

export function createFeishuService() {
    const appId = import.meta.env.VITE_FEISHU_APP_ID;
    const appSecret = import.meta.env.VITE_FEISHU_APP_SECRET;
    // Use user provided BaseID/TableID if env not set, but better to use env
    const baseId = import.meta.env.VITE_FEISHU_BASE_ID || 'D6LobZNPoalgEysACHKcGShln6d';
    const tableId = import.meta.env.VITE_FEISHU_TABLE_ID || 'tbliAsv53wMBI3yG';

    if (!appId || !appSecret) {
        console.warn('Feishu credentials missing');
        return null;
    }

    return new FeishuService({ appId, appSecret, baseId, tableId });
}
