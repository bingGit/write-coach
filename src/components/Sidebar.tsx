import { BookText, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncRecord {
    original: string;
    refined: string;
    style: string;
    date: string;
}

interface SidebarProps {
    history: SyncRecord[];
    onSelect: (record: SyncRecord) => void;
    onRefresh: () => void;
    isLoading: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export function Sidebar({ history, onSelect, onRefresh, isLoading, hasMore, onLoadMore }: SidebarProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <BookText className="w-4 h-4" />
                    练习记录
                </h2>
                <button
                    onClick={onRefresh}
                    className={`p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ${isLoading && !hasMore ? 'animate-spin' : ''}`}
                    title="刷新列表"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                            <AlertCircle className="w-5 h-5 text-zinc-600" />
                        </div>
                        <p className="text-sm text-zinc-500">
                            暂无记录<br />
                            从飞书同步的历史将显示在这里
                        </p>
                    </div>
                ) : (
                    <>
                        {history.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => onSelect(item)}
                                className="group relative p-4 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        {item.style}
                                    </span>
                                    <span className="text-xs text-zinc-600">
                                        {new Date(item.date).toLocaleString('zh-CN', {
                                            month: '2-digit', day: '2-digit',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="text-sm text-zinc-300 line-clamp-2 leading-relaxed font-serif mb-1">
                                    {item.original}
                                </div>
                                <div className="text-xs text-zinc-500 line-clamp-1 italic">
                                    {item.refined}
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <button
                                onClick={onLoadMore}
                                disabled={isLoading}
                                className="w-full py-3 mt-4 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all border border-transparent hover:border-zinc-800 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        加载中...
                                    </>
                                ) : (
                                    '加载更多'
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
