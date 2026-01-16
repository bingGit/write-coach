import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/chat/ChatInterface';
import { STYLES, type StyleProfile } from './data/styles';
import { createLLMService } from './services/llm';
import { createFeishuService, type SyncRecord } from './services/feishu';
import { PenTool } from 'lucide-react';

function App() {
  const [currentStyle, setCurrentStyle] = useState<StyleProfile | null>(null);
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [pageToken, setPageToken] = useState<string>('');
  const [hasMore, setHasMore] = useState(false);

  const llmService = useMemo(() => createLLMService(), []);
  const feishuService = useMemo(() => createFeishuService(), []);

  const fetchHistory = async (isLoadMore = false) => {
    if (!feishuService) return;
    setIsLoadingHistory(true);
    try {
      const tokenToUse = isLoadMore ? pageToken : undefined;
      const result = await feishuService.getHistory(tokenToUse);

      if (isLoadMore) {
        setHistory(prev => [...prev, ...result.items]);
      } else {
        setHistory(result.items);
      }

      setHasMore(result.hasMore);
      setPageToken(result.nextPageToken || '');

    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, [feishuService]);

  const handleSelectHistory = (record: SyncRecord) => {
    // 1. Find matching style
    const style = STYLES.find(s => s.name === record.style) || STYLES[0];
    setCurrentStyle(style);

    // 2. Construct initial messages
    setInitialMessages([
      { role: 'system', content: style.systemPrompt },
      { role: 'user', content: record.original },
      { role: 'assistant', content: record.refined }
    ]);
  };

  const handleBack = () => {
    setCurrentStyle(null);
    setInitialMessages([]);
  };

  /* ===== 1. 欢迎/选择页面 (Home) ===== */
  if (!currentStyle) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-200">
        {/* 背景装饰 */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center animate-enter">
          {/* Header */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6 shadow-indigo-500/10">
              <PenTool className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-white tracking-tight">
              Writer's Coach
            </h1>
            <p className="text-zinc-500 text-lg">
              选择一位教练，开始你的写作训练
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setCurrentStyle(style);
                  setInitialMessages([]); // Reset messages for new chat
                }}
                className="group flex flex-col items-start p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 text-left"
              >
                <span className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 block">
                  {style.emoji}
                </span>
                <h3 className="text-xl font-medium text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {style.name}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-light">
                  {style.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ===== 2. 工作台页面 (Workspace) ===== */
  return (
    <div className="h-screen w-screen flex flex-row bg-zinc-950 overflow-hidden">
      {/* 左侧：聊天主区域 (占据剩余空间) */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        <ChatInterface
          styleProfile={currentStyle}
          llmService={llmService}
          initialMessages={initialMessages}
          onBack={handleBack}
          onSyncSuccess={() => fetchHistory(false)}
        />
      </main>

      {/* 右侧：侧边栏 (固定宽度) */}
      {/* 使用 hidden md:flex 确保在桌面端显示为 flex */}
      <aside className="w-80 h-full border-l border-zinc-800/50 bg-zinc-900/30 hidden md:flex flex-col shrink-0">
        <Sidebar
          history={history}
          onSelect={handleSelectHistory}
          onRefresh={() => fetchHistory(false)}
          isLoading={isLoadingHistory}
          hasMore={hasMore}
          onLoadMore={() => fetchHistory(true)}
        />
      </aside>
    </div>
  );
}

export default App;
