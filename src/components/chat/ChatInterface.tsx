import { useState, useRef, useEffect, useMemo } from 'react';
import { SendHorizonal, ArrowLeft, Loader2, Bot, User, Copy, Check, UploadCloud, Square, CheckSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, LLMProvider } from '../../services/llm/types';
import type { StyleProfile } from '../../data/styles';
import { createFeishuService } from '../../services/feishu';

interface ChatInterfaceProps {
    styleProfile: StyleProfile;
    llmService: LLMProvider;
    initialMessages?: Message[];
    onBack: () => void;
    onSyncSuccess?: () => void;
}

export function ChatInterface({ styleProfile, llmService, onBack, initialMessages, onSyncSuccess }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);

    // Initialize or Reset messages when profile or history changes
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        } else {
            setMessages([
                { role: 'system', content: styleProfile.systemPrompt },
                { role: 'assistant', content: styleProfile.openingMessage }
            ]);
        }
    }, [styleProfile, initialMessages]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Feishu Sync State
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const feishuService = useMemo(() => createFeishuService(), []);

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

        // Add empty AI message placeholder for streaming
        setMessages(p => [...p, { role: 'assistant', content: '' }]);

        try {
            await llmService.sendMessageStream([...messages, userMsg], (chunk) => {
                // Update the last message (AI placeholder) with new content
                setMessages(p => {
                    const updated = [...p];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + chunk
                    };
                    return updated;
                });
            });
        } catch (e) {
            setMessages(p => {
                const updated = [...p];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = { ...updated[lastIdx], content: '连接断开，请检查网络或配置。' };
                return updated;
            });
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

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleSync = async () => {
        if (!feishuService) {
            alert('请先在 .env.local 中配置飞书 API 信息');
            return;
        }

        // Find pairs from selection
        // Logic: For each selected AI message, find the most recent User message (either selected or just strictly preceding)
        // User request: "check my question, AI answer" implies explicit selection of both.
        // Let's implement strict explicit pairing from selection.

        setIsSyncing(true);
        setSyncStatus('idle');

        try {
            // IMPORTANT: Use the SAME filtered array as rendered in UI
            const displayMessages = messages.filter(m => m.role !== 'system');
            const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);

            const pairs: Array<{ original: string, refined: string }> = [];

            for (let i = 0; i < sortedIndices.length; i++) {
                const idx = sortedIndices[i];
                const msg = displayMessages[idx];

                if (!msg) continue; // Safety check

                if (msg.role === 'user') {
                    // Look ahead in SELECTION for the next assistant message
                    const nextSelectedIdx = sortedIndices[i + 1];
                    if (nextSelectedIdx !== undefined) {
                        const nextMsg = displayMessages[nextSelectedIdx];
                        if (nextMsg?.role === 'assistant') {
                            pairs.push({
                                original: msg.content,
                                refined: nextMsg.content
                            });
                            i++; // Skip next msg as it is consumed
                        }
                    }
                }
            }

            if (pairs.length === 0) {
                // Fallback: If user only selected Assistant, try to find immediate preceding User message
                for (const idx of sortedIndices) {
                    const msg = displayMessages[idx];
                    if (msg?.role === 'assistant') {
                        // Find preceding user in displayMessages
                        for (let j = idx - 1; j >= 0; j--) {
                            if (displayMessages[j]?.role === 'user') {
                                const exists = pairs.find(p => p.refined === msg.content);
                                if (!exists) {
                                    pairs.push({
                                        original: displayMessages[j].content,
                                        refined: msg.content
                                    });
                                }
                                break;
                            }
                        }
                    }
                }
            }

            if (pairs.length === 0) {
                alert('未识别到有效的问答对。请至少选择一条 AI 回复。');
                setIsSyncing(false);
                return;
            }

            // Sync sequentially
            for (const pair of pairs) {
                await feishuService.syncRecord({
                    original: pair.original,
                    refined: pair.refined,
                    style: styleProfile.name, // e.g. "攻击性写作"
                    date: new Date().toISOString()
                });
            }

            setSyncStatus('success');
            onSyncSuccess?.(); // Refresh history list
            setTimeout(() => {
                setSelectMode(false);
                setSelectedIndices(new Set());
                setSyncStatus('idle');
            }, 2000);

        } catch (error) {
            console.error(error);
            setSyncStatus('error');
            alert(`同步失败: ${(error as Error).message}`);
        } finally {
            setIsSyncing(false);
        }
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

                {/* Right Actions: Sync */}
                <div className="flex items-center gap-3">
                    {selectMode ? (
                        <>
                            <span className="text-xs text-zinc-500">已选 {selectedIndices.size} 项</span>
                            <button
                                onClick={handleSync}
                                disabled={selectedIndices.size === 0 || isSyncing}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSyncing
                                    ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                                    : syncStatus === 'success'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                        : selectedIndices.size > 0
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                {syncStatus === 'success' ? '已同步' : '同步飞书'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectMode(false);
                                    setSelectedIndices(new Set());
                                }}
                                className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm"
                            >
                                取消
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setSelectMode(true)}
                            className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            title="选择并同步到飞书"
                        >
                            <UploadCloud className="w-5 h-5" />
                        </button>
                    )}
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
                        const isSelected = selectedIndices.has(idx);

                        return (
                            <div key={idx} className={`flex gap-4 items-start ${isAi ? '' : 'flex-row-reverse'} group/msg transition-opacity ${selectMode && !isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}>

                                {/* Selection Checkbox */}
                                {selectMode && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => toggleSelection(idx)}
                                            className={`p-1 rounded-md transition-colors ${isSelected ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
                                                }`}
                                        >
                                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${isAi
                                    ? 'bg-zinc-900 border-zinc-800 text-indigo-400'
                                    : 'bg-zinc-200 border-zinc-300 text-zinc-600'
                                    }`}>
                                    {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                </div>

                                {/* Message */}
                                <div
                                    onClick={() => selectMode && toggleSelection(idx)}
                                    className={`relative px-5 py-3.5 rounded-2xl text-base leading-relaxed group min-w-0 overflow-hidden cursor-default ${selectMode ? 'cursor-pointer hover:ring-1 hover:ring-indigo-500/50' : ''
                                        } ${isSelected ? 'ring-2 ring-indigo-500 shadow-indigo-500/20 shadow-lg' : ''
                                        } ${isAi
                                            ? 'bg-zinc-900 border border-zinc-800/60 text-zinc-300 shadow-sm w-full'
                                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                        }`}
                                >

                                    {isAi ? (
                                        <div className="prose prose-invert prose-zinc max-w-none prose-p:my-2 prose-headings:mb-3 prose-headings:mt-6 prose-ul:my-2 prose-li:my-0.5">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    )}

                                    {/* Copy Button (Only for AI messages, Hide in Select Mode) */}
                                    {isAi && !selectMode && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(msg.content, msgId);
                                            }}
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
                        <div className="flex gap-4 animate-pulse pl-12">
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
            <div className={`p-6 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur shrink-0 transition-opacity ${selectMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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
