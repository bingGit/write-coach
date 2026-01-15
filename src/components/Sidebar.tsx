import { Copy, BookText, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Draft {
    id: string;
    content: string;
    timestamp: number;
}

export function Sidebar({ drafts }: { drafts: Draft[] }) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-zinc-800/50">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <BookText className="w-4 h-4" />
                    练习记录
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {drafts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                            <AlertCircle className="w-5 h-5 text-zinc-600" />
                        </div>
                        <p className="text-sm text-zinc-500">
                            这里空空如也<br />
                            试着写点什么，好句子会自动保存
                        </p>
                    </div>
                ) : (
                    drafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="group relative p-4 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200"
                        >
                            <div className="text-sm text-zinc-300 line-clamp-4 leading-relaxed font-serif">
                                {draft.content}
                            </div>

                            <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-zinc-600">
                                    {new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                    onClick={() => handleCopy(draft.id, draft.content)}
                                    className="p-1.5 hover:bg-zinc-700 rounded-md text-zinc-500 hover:text-white transition-colors"
                                >
                                    {copiedId === draft.id ? (
                                        <span className="text-xs text-emerald-400 font-medium">已复制</span>
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
