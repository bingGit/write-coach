export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMProvider {
    sendMessage(messages: Message[]): Promise<string>;
}
