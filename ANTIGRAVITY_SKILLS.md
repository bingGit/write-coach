# Antigravity Skills 详解

在 `.agent/skills` 目录中，共有 14 个 Skill，它们构成了**Antigravity**（一种高标准、系统化的开发方法论）的核心能力。

这些 Skill 分为几大类：**流程控制**、**开发实施**、**代码质量** 和 **系统化问题解决**。

以下是每个 Skill 的详细作用和使用方式：

---

## 1. 核心流程与计划 (Planning & Process)

### `using-superpowers`
*   **作用**：这是总入口。要求在回复任何用户消息前，先思考是否有适用的 Skill，如果有，**必须**调用。
*   **使用方式**：Start of turn -> Check skills -> Invoke specific skill -> Follow instructions.

### `brainstorming` (头脑风暴)
*   **作用**：在开始任何创造性工作（新功能、组件）之前，通过对话理清需求和设计。
*   **使用方式**：
    1.  阅读现有项目上下文。
    2.  和用户进行问答（一次一个问题），明确需求。
    3.  提出 2-3 个方案并推荐一个。
    4.  分段展示设计（200-300字），逐步确认。
    5.  最终产出设计文档到 `docs/plans/`。

### `writing-plans` (编写计划)
*   **作用**：将设计转化为详尽的实施计划（Implementation Plan）。假设执行者对项目一无所知。
*   **使用方式**：
    1.  创建 `docs/plans/YYYY-MM-DD-feature.md`。
    2.  按“咬碎的任务”(Bite-Sized Tasks) 粒度拆分，每个任务 2-5 分钟工作量。
    3.  必须包含：具体文件路径、要修改的代码行、具体的测试用例代码、验证命令。
    4.  遵循 DRY, YAGNI, TDD 原则。

### `executing-plans` (执行计划)
*   **作用**：在一个单独的 Session 中，加载并执行已有的 Implementation Plan。
*   **使用方式**：
    1.  加载计划文件。
    2.  按批次（Batch）执行任务（默认首批3个）。
    3.  每批次完成后向用户汇报并等待反馈。
    4.  重复直到完成。

### `subagent-driven-development` (子智能体驱动开发)
*   **作用**：在**当前 Session** 中快速执行计划，为每个任务指派独立的 Subagent。
*   **使用方式**：
    1.  读取整个计划。
    2.  为每个任务创建一个 Todo。
    3.  **Implementer** (实现者) 子智能体：负责写代码和测试。
    4.  **Spec Reviewer** (规格审查) 子智能体：检查是否符合需求文档，不许遗漏或自作主张。
    5.  **Code Quality Reviewer** (代码质量审查) 子智能体：检查代码质量。
    6.  每个环节不通过则打回重做。

---

## 2. 只有一种正确的开发方式 (Development Discipline)

### `test-driven-development` (TDD / 测试驱动开发)
*   **作用**：**铁律**。没有失败的测试之前，不许写任何业务代码。
*   **使用方式**：
    1.  **RED**: 写一个最小的失败测试（必须先眼见其变红）。
    2.  **GREEN**: 写最少量的代码让测试通过。
    3.  **REFACTOR**: 在测试通过的前提下重构代码。
    4.  严禁“先写代码后补测试”。

### `verification-before-completion` (完成前验证)
*   **作用**：防止“假装完成了”。在声称“修复了”或“完成了”之前，必须运行验证命令。
*   **使用方式**：
    1.  不要说 "Should work now" (应该以此行了)。
    2.  运行验证命令（测试、构建等）。
    3.  阅读完整的输出。
    4.  **带着证据**汇报结果。

---

## 3. 代码审查与合并 (Review & Finish)

### `requesting-code-review` (请求代码审查)
*   **作用**：在任务节点或合并前，主动请求 Review。
*   **使用方式**：
    1.  确定 commit 范围 (`BASE_SHA` 到 `HEAD_SHA`)。
    2.  召唤 `code-reviewer` 子智能体进行审查。
    3.  根据反馈修改（Critical 必须修，Important 最好修，Minor 记下来）。

### `receiving-code-review` (接收代码审查)
*   **作用**：如何专业地处理反馈。不盲从，不表演式客气。
*   **使用方式**：
    1.  **验证**：先检查反馈在技术上是否正确。
    2.  **YAGNI**：如果是不需要的功能，用 YAGNI 驳回。
    3.  **行动**：直接修复，不要说 "Thanks" 或 "Great catch"，用代码回应。

### `finishing-a-development-branch` (结束开发分支)
*   **作用**：开发完成后的标准收尾动作。
*   **使用方式**：
    1.  首先运行全量测试确保绿色。
    2.  给用户提供 4 个标准选项：
        1. Merge locally (在本地合并)
        2. Create PR (推送到远程并创建 PR)
        3. Keep as-is (保留现状)
        4. Discard (放弃并删除)
    3.  执行用户选择，清理 Worktree。

---

## 4. 调试与问题解决 (Debugging)

### `systematic-debugging` (系统化调试)
*   **作用**：禁止“猜一猜”式修 bug。
*   **使用方式**：
    1.  **Phase 1 根因分析**：读报错、复现、找证据。没有证据不许修。
    2.  **Phase 2 模式分析**：对比正常和异常的情况。
    3.  **Phase 3 假设与测试**：提出一个假设，做最小测试验证。
    4.  **Phase 4 实施**：写一个失败测试复现 bug，然后修复它。

### `dispatching-parallel-agents` (并行派发智能体)
*   **作用**：遇到多个互不相关的错误（如3个不同的测试文件挂了），派多个 Subagent 同时修。
*   **使用方式**：
    1.  识别独立的问题领域。
    2.  为每个问题派发一个专门的 Subagent。
    3.  最后集成所有修复。

---

## 5. 环境与工具 (Environment & Meta)

### `using-git-worktrees` (使用 Git Worktree)
*   **作用**：在隔离的目录中开发新功能，不影响主目录。
*   **使用方式**：
    1.  优先检查 `.worktrees/` 目录。
    2.  创建新 Worktree。
    3.  自动运行项目初始化（npm install 等）。
    4.  确保环境干净（跑一遍测试）。

### `writing-skills` (编写 Skills)
*   **作用**：用于创建新的 Skill 或修改现有 Skill。
*   **使用方式**：
    1.  把流程文档视为代码，对其通过 TDD 方式编写。
    2.  先写“失败用力”（Pressure Scenario）：让 Agent 在没文档时犯错。
    3.  编写 `SKILL.md` 纠正行为。
    4.  再测一遍确保 Agent 遵守规则。

---
**总结使用心法：**
*   **Before code**: `brainstorming` -> `using-git-worktrees` -> `writing-plans`
*   **During code**: `subagent-driven-development` -> `test-driven-development`
*   **On bug**: `systematic-debugging`
*   **Before finish**: `verification-before-completion` -> `requesting-code-review` -> `finishing-a-development-branch`

这一套体系的核心就是**消除不确定性**，用严格的**验证**代替**猜测**。
