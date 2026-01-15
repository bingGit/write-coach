import { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/chat/ChatInterface';
import { STYLES, type StyleProfile } from './data/styles';
import { createLLMService } from './services/llm';
import { PenTool } from 'lucide-react';

interface Draft {
  id: string;
  content: string;
  timestamp: number;
}

function App() {
  const [currentStyle, setCurrentStyle] = useState<StyleProfile | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const llmService = useMemo(() => createLLMService(), []);

  const handleSaveDraft = (content: string) => {
    const newDraft = { id: Date.now().toString(), content, timestamp: Date.now() };
    setDrafts(prev => [newDraft, ...prev]);
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
                onClick={() => setCurrentStyle(style)}
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
          onSaveDraft={handleSaveDraft}
          onBack={() => setCurrentStyle(null)}
        />
      </main>

      {/* 右侧：侧边栏 (固定宽度) */}
      {/* 使用 hidden md:flex 确保在桌面端显示为 flex */}
      <aside className="w-80 h-full border-l border-zinc-800/50 bg-zinc-900/30 hidden md:flex flex-col shrink-0">
        <Sidebar drafts={drafts} />
      </aside>
    </div>
  );
}

export default App;
