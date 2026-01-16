# 飞书历史记录分页计划

> **给 Agent 的指令:** 必须使用 `superpowers:executing-plans` 技能来实现。

**目标:** 飞书历史记录列表超过 100 条时，实现“加载更多”功能。

**架构:**
- **Service:** 在 API 调用中支持 `pageToken`。
- **State:** 在 App 中管理 `pageToken` 和 `hasMore` 状态。
- **UI:** 在侧边栏底部添加“加载更多”按钮。

---

### 任务 1: 更新 FeishuService 以支持分页

**文件:**
- 修改: `src/services/feishu.ts`

**步骤:**
1.  更新 `getHistory` 签名为 `getHistory(pageToken?: string): Promise<{ items: SyncRecord[], hasMore: boolean, nextPageToken?: string }>`
2.  将 `pageToken` 传递给飞书 API 查询参数。
3.  返回包含分页元数据的完整响应结构。

### 任务 2: 更新 App 状态

**文件:**
- 修改: `src/App.tsx`

**步骤:**
1.  添加 `hasMore` 和 `nextPageToken` 状态变量。
2.  更新 `fetchHistory` 以处理两种模式：“刷新”（重置）与“加载更多”（追加）。
3.  实现 `handleLoadMore` 函数。

### 任务 3: 更新侧边栏 UI

**文件:**
- 修改: `src/components/Sidebar.tsx`

**步骤:**
1.  添加 props: `hasMore: boolean`, `onLoadMore: () => void`, `isLoadingMore: boolean`。
2.  当 `hasMore` 为真时，在列表底部渲染“加载更多”按钮。
