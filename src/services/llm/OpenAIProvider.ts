import type { LLMProvider, Message } from './types';

export interface DeepSeekConfig {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    enableThinking?: boolean;
}

export class DeepSeekProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
    private enableThinking: boolean;

    constructor(config: DeepSeekConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://api.deepseek.com';
        this.model = config.model || 'deepseek-chat';
        this.enableThinking = config.enableThinking ?? false;
    }

    async sendMessage(messages: Message[]): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    ...(this.enableThinking ? {} : { reasoning_effort: 'none' })
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'Error: No response content';
        } catch (error) {
            console.error('DeepSeek Request Failed:', error);
            return `Error: ${(error as Error).message}. (请检查 API Key 和网络连接)`;
        }
    }
}

// 保留旧的 OpenAI Provider 以备兼容
export class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async sendMessage(messages: Message[]): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'Error: No response content';
        } catch (error) {
            console.error('LLM Request Failed:', error);
            return `Error: ${(error as Error).message}. (请检查 API Key)`;
        }
    }
}
