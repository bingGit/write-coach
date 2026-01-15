import type { LLMProvider } from './types';
import { MockProvider } from './MockProvider';
import { DeepSeekProvider } from './OpenAIProvider';

export function createLLMService(): LLMProvider {
    // 检查 localStorage 中的持久化配置
    const useMock = typeof window !== 'undefined' && localStorage.getItem('USE_MOCK') === 'true';

    // 如果强制开启了 Mock
    if (useMock) {
        console.log('🔧 当前: Mock 模式 (手动强制)');
        return new MockProvider();
    }

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

    if (apiKey) {
        console.log('🚀 当前: 真实 API');
        return new DeepSeekProvider({ apiKey, baseUrl, model, enableThinking: false });
    }

    console.log('🔧 当前: Mock 模式 (未配置 API Key)');
    return new MockProvider();
}

if (typeof window !== 'undefined') {
    // 初始化 localStorage 状态
    if (localStorage.getItem('USE_MOCK') === null) {
        localStorage.setItem('USE_MOCK', 'false');
    }

    // @ts-ignore
    window.debug = {
        enableMock: () => {
            localStorage.setItem('USE_MOCK', 'true');
            console.log('✅ 切换到 Mock 模式，正在刷新...');
            location.reload();
        },
        disableMock: () => {
            localStorage.setItem('USE_MOCK', 'false');
            console.log('✅ 切换到真实 API，正在刷新...');
            location.reload();
        }
    };

    console.log('💡 切换: window.debug.enableMock() / window.debug.disableMock()');
}
