export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMProvider {
    sendMessage(messages: Message[]): Promise<string>;
    sendMessageStream(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
