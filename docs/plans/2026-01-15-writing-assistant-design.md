# 设计：对话式写作教练 (Writer's Coach)

## 概述
这是一个基于网页的写作辅助工具，它不像直接编辑器那样直接修改文字，而是作为一个“苏格拉底式教练”。它通过互动对话、提问和反馈，帮助用户养成特定的写作风格（例如：极简主义、情感共鸣）。

## 目标
- **习惯养成**: 通过练习而非单纯的纠错，帮助用户内化写作规则。
- **隐私与灵活性**: 支持自定义 API Key，并提供纯本地/Mock 模式以便测试。
- **美学**: 高级、无干扰的界面（如高饱和度或深色模式）。

## 架构

### 技术栈
- **框架**: React + Vite
- **样式**: TailwindCSS (原子化 CSS，易于定制主题)
- **部署**: Vercel (静态站点生成)
- **图标**: Lucide-React

### 核心组件
1.  **StyleSelector (风格选择器)**: 卡片式界面，用于选择本次会话的“教练人格”。
2.  **ChatInterface (聊天界面)**: 核心循环。展示 AI 的提问和用户的草稿。
3.  **DraftBoard (侧边栏草稿板)**: “实时”收集已定稿/已批准的段落。
4.  **DebugPanel/Console (调试面板)**: 默认隐藏，允许切换 API 模式。

### 数据流
1.  用户选择一个 `StyleProfile` (JSON 配置)。
2.  `ChatSession` 使用 `StyleProfile.systemPrompt` 初始化。
3.  用户输入 -> `LLMService` -> 响应。
4.  如果响应批准内容 -> 添加到 `DraftBoard`。

### API 与 Mock 策略
应用将拥有一个 LLM 调用的抽象层。

```typescript
interface LLMProvider {
  sendMessage(messages: Message[]): Promise<string>;
}
```

- **MockProvider**: 根据关键词或从风格的备选回复中随机选择，返回预设的响应。
- **RealProvider**: 使用 `.env` 中的 `OPENAI_API_KEY` (或本地存储中的 Key) 调用 LLM API。
- **切换**: 暴露 `window.debug.useMock(boolean)` 在运行时切换，默认读取 `.env` 配置。

## 数据模型

**StyleProfile (风格配置)**
```json
{
  "id": "minimalist",
  "name": "🌿 极简主义",
  "systemPrompt": "你是一个严格的编辑。专注于简洁...",
  "openingMessage": "让我们删除一切冗余。你今天想写什么？"
}
```

## 未来考量
- **本地存储**: 保存聊天记录和草稿。
- **自定义风格**: 允许用户粘贴自己的提示词/风格规则。
