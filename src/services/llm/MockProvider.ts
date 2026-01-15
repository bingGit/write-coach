import type { LLMProvider, Message } from './types';
import { STYLES } from '../../data/styles';

export class MockProvider implements LLMProvider {
    async sendMessage(messages: Message[]): Promise<string> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const lastUserMessage = messages[messages.length - 1].content;

        // Simple logic to simulate "reading" the style
        const systemMsg = messages.find(m => m.role === 'system')?.content || '';
        const currentStyle = STYLES.find(s => systemMsg.includes(s.name) || systemMsg.includes(s.description));

        if (currentStyle?.id === 'minimalist') {
            return `[Mock] (极简模式) 我注意到你用了 "${lastUserMessage.slice(0, 5)}..." 这一句。试着删除形容词，只保留动词，你会怎么写？`;
        }

        if (currentStyle?.id === 'emotional') {
            return `[Mock] (情绪模式) 这段话有点平淡。闭上眼睛，你当时闻到了什么味道？试着把它写进去。`;
        }

        if (currentStyle?.id === 'logical') {
            return `[Mock] (逻辑模式) 你的观点很有趣，但是证据呢？这句 "${lastUserMessage.slice(0, 10)}..." 似乎缺乏支撑。`;
        }

        return `[Mock] 收到你的内容：${lastUserMessage}。请根据当前风格继续修改。`;
    }
}
