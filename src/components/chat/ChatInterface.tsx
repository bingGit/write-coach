import { useState, useRef, useEffect } from 'react';
import { SendHorizonal, ArrowLeft, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, LLMProvider } from '../../services/llm/types';
import type { StyleProfile } from '../../data/styles';

interface ChatInterfaceProps {
    styleProfile: StyleProfile;
    llmService: LLMProvider;
    onSaveDraft: (text: string) => void;
    onBack: () => void;
}

export function ChatInterface({ styleProfile, llmService, onBack }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: styleProfile.systemPrompt },
        { role: 'assistant', content: styleProfile.openingMessage }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMsg: Message = { role: 'user', content: input };
        setMessages(p => [...p, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await llmService.sendMessage([...messages, userMsg]);
            setMessages(p => [...p, { role: 'assistant', content: response }]);
        } catch (e) {
            setMessages(p => [...p, { role: 'assistant', content: '连接断开，请检查网络或配置。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/50">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{styleProfile.emoji}</span>
                        <div className="flex flex-col">
                            <span className="font-medium text-zinc-200 text-sm">{styleProfile.name}</span>
                            <span className="text-xs text-zinc-500">AI 教练</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto w-full scroll-smooth"
            >
                <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
                    {messages.filter(m => m.role !== 'system').map((msg, idx) => {
                        const isAi = msg.role === 'assistant';
                        const msgId = `msg-${idx}`;

                        return (
                            <div key={idx} className={`flex gap-4 ${isAi ? '' : 'flex-row-reverse'}`}>

                                {/* Avatar */}
                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${isAi
                                    ? 'bg-zinc-900 border-zinc-800 text-indigo-400'
                                    : 'bg-zinc-200 border-zinc-300 text-zinc-600'
                                    }`}>
                                    {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>

                                {/* Message */}
                                <div className={`relative px-5 py-3.5 rounded-2xl text-base leading-relaxed group min-w-0 overflow-hidden ${isAi
                                    ? 'bg-zinc-900 border border-zinc-800/60 text-zinc-300 shadow-sm w-full'
                                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                    }`}>

                                    {isAi ? (
                                        <div className="prose prose-invert prose-zinc max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-6 prose-ul:my-2 prose-li:my-0.5">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}

                                    {/* Copy Button (Only for AI messages) */}
                                    {isAi && (
                                        <button
                                            onClick={() => handleCopy(msg.content, msgId)}
                                            className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/50 text-zinc-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-700 hover:text-zinc-200"
                                            title="复制全部"
                                        >
                                            {copiedId === msgId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-2 text-zinc-500 text-sm pt-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                正在思考...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur shrink-0">
                <div className="max-w-3xl mx-auto relative group">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入你的文稿... (Shift+Enter 换行)"
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:bg-zinc-900 transition-all resize-none min-h-[52px] max-h-48"
                        style={{ height: 'auto' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <SendHorizonal className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
