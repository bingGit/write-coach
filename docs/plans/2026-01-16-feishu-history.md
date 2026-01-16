# 飞书历史记录集成计划

> **给 Agent 的指令:** 必须使用 `superpowers:subagent-driven-development` 技能，逐个任务地实现此计划。

**目标:** 使用从飞书 Bitable 同步的“练习档案”替换本地的“草稿箱”。点击记录可恢复对话上下文。

**架构:**
- **Service 层:** 扩展 `FeishuService` 以从 Bitable 读取记录。
- **状态管理:** 将 `history` 状态提升至 `App.tsx`，并在加载时获取。
- **UI:** 侧边栏显示历史条目；点击条目将 ChatInterface 状态重置为该对话上下文。

**技术栈:** React, TypeScript, Feishu Open API.

---

### 任务 1: 扩展 FeishuService

**文件:**
- 修改: `src/services/feishu.ts`

**步骤 1: 编写失败测试 (概念性 - 验证 API 结构)**
- 需要一个 `getHistory()` 方法，调用 `GET /bitable/v1/apps/:base_id/tables/:table_id/records`。

**步骤 2: 实现**
- 向 `FeishuService` 添加 `getHistory(): Promise<SyncRecord[]>`。
- 将飞书字段 ('原句', '润色', '风格', '日期') 映射回 `SyncRecord` 接口。
- **注意**：飞书日期字段如果是时间戳，需要转换。

### 任务 2: 在 App.tsx 中集成历史记录

**文件:**
- 修改: `src/App.tsx`
- 修改: `src/components/Sidebar.tsx` (接口更新)

**步骤 1: 状态替换**
- 删除 `drafts` 状态。
- 添加 `history` 状态 (`SyncRecord[]`)。
- 添加 `useEffect`，在组件挂载时使用 `feishuService.getHistory()` 加载数据。

**步骤 2: 侧边栏更新**
- 更新 `Sidebar` props，接收 `history` 记录而非 drafts。
- 渲染“原句”(截断)作为标题，“风格” + “日期”作为元数据。

**步骤 3: 恢复上下文逻辑**
- 实现 `handleLoadHistory(record)`:
  - 根据记录的 style 字段查找对应的 StyleProfile，并 `setCurrentStyle`。
  - 为 `ChatInterface` 设置 `initialMessages`:
    1. System Prompt (来自 style)
    2. User Message (record.original)
    3. AI Message (record.refined)

### 任务 3: 更新 ChatInterface 以支持历史加载

**文件:**
- 修改: `src/components/chat/ChatInterface.tsx`

**步骤 1: 接收初始消息**
- 添加 `initialMessages` prop (可选)。
- 如果提供了 `initialMessages`，则使用它初始化 `messages` 状态，而不是默认的开场白。
- 当 `initialMessages` 变化时，重置状态。
