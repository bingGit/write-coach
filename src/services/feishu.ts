interface FeishuConfig {
    baseId: string;
    tableId: string;
}

export interface SyncRecord {
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

        // Token is now obtained from server-side API (credentials stay on server)
        const response = await fetch('/feishu-api/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // No credentials sent from frontend
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

    async getHistory(pageToken?: string): Promise<{ items: SyncRecord[], hasMore: boolean, nextPageToken?: string }> {
        const token = await this.getTenantAccessToken();
        const { baseId, tableId } = this.config;

        // Sort by Date descending
        const sortParam = JSON.stringify(['日期 DESC']);
        let url = `/feishu-api/open-apis/bitable/v1/apps/${baseId}/tables/${tableId}/records?sort=${encodeURIComponent(sortParam)}&pageSize=100`;

        if (pageToken) {
            url += `&page_token=${pageToken}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fetch History Failed: ${errorText}`);
        }

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Fetch History Error: ${data.msg}`);
        }

        const items = (data.data.items || []).map((item: any) => ({
            original: item.fields['原句'] || '',
            refined: item.fields['润色'] || '',
            style: item.fields['风格'] || '默认',
            date: new Date(item.fields['日期']).toISOString()
        }));

        return {
            items,
            hasMore: data.data.has_more,
            nextPageToken: data.data.page_token
        };
    }
}

export function createFeishuService() {
    // Only need baseId and tableId (non-sensitive)
    const baseId = import.meta.env.VITE_FEISHU_BASE_ID || 'D6LobZNPoalgEysACHKcGShln6d';
    const tableId = import.meta.env.VITE_FEISHU_TABLE_ID || 'tbliAsv53wMBI3yG';

    return new FeishuService({ baseId, tableId });
}
