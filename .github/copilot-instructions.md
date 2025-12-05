<!--
简短说明：为 AI 编码代理（Copilot / 内部 agent）提供可立即使用的、本仓库特定的指导。
此文件只记录从代码库可发现的事实与约定，不包含假设或未实现的流程。
-->

# 项目快速导引（仅可发现的内容）

概览
- 本仓库是一个单文件静态前端工具：`index.html`（移动优先，横屏交互）。
- 无构建脚本、无依赖管理文件（例如 `package.json`、`requirements.txt`），也没有测试或 CI 定义可发现。

关键文件
- `index.html`：全部实现（样式、布局、交互脚本）都在此单文件中。
  - 重要常量：`EV_VALUES`, `CELL_WIDTH`, `CARD_WIDTH`, `CARD_COUNT`, `MIDDLE_INDEX`。
  - 重要函数：`generateTableCells()`, `generateEVRuler()`, `generateExposureCards()`, `bindRulerDrag()`, `bindCardDrag()`, `handleCardDrop()`, `resetTable()`, `resetCardsContent()`。

代码/架构要点（大局）
- 单文件实现，UI 与交互紧耦合在 `index.html` 内的 `<style>` 与 `<script>` 中。
- 交互面向移动端（触摸事件）与桌面（鼠标/拖放）双向兼容，但页面在竖屏下会隐藏主视图（CSS media queries），因此在开发或验证交互时请使用横屏或调整浏览器尺寸到横向。
- 视觉/布局基于固定列宽（11 列，每列 `60px`），多处 CSS 和 JS 依赖该宽度：改变列数或列宽需同时修改 CSS 与 JS 常量。

可直接运行与调试
- 由于是静态单文件，最简单的验证：在浏览器中直接打开 `index.html`。
- 若需要通过本地服务器调试（跨源或 ServiceWorker 场景可用）：
  - Python: `python -m http.server 8000` （在仓库根目录运行），然后打开 `http://localhost:8000`。
  - Node (临时): `npx serve .` 或安装 `serve` 后 `serve .`。
  - VS Code: 使用 `Live Server` 插件直接在编辑器中预览。

修改建议（保持一致性）
- 若调整列数（11）或列宽，请同时更新：CSS 中 `.ev-ruler` / `.exposure-table` 宽度表达式（例如 `calc(11 * 60px)`）和脚本顶部的常量 `EV_VALUES` / `CELL_WIDTH` / `TABLE_TOTAL_WIDTH` 等。
- 卡片布局使用 `CARD_INITIAL_POSITIONS` 基于 `CENTER_OFFSET` 计算：修改卡片尺寸或间距也需更新 `CARD_WIDTH`、`CARD_GAP`、`CARD_COUNT`。
- 横竖屏行为通过 media queries 控制：测试新交互时请确保在横屏（`(orientation: landscape)`）下验证。

常见编辑场景示例
- 添加新字段到卡片：
  - 在 `generateExposureCards()` 中修改 `card.innerHTML`，并在 `resetCardsContent()` 中添加对应的清空逻辑。
- 更改拖放行为（例如允许多卡片堆叠）：
  - 修改 `handleCardDrop()` 中对已有卡片的检查（当前会阻止重复放入）。

调试要点
- 使用浏览器 DevTools 的 Elements / Event Listeners / Touch 模拟（Chrome 的 Device Toolbar）来模拟触摸与横屏。
- 常见问题定位：
  - “标尺没有对齐”：检查 `CELL_WIDTH` 常量与 CSS 宽度是否一致，调试 `alignRulerToNearestCell()` 的计算结果。
  - “卡片放不进去”：检查 `handleCardDrop()` 是否正确定位到 `.table-cell`，以及目标单元格内是否已有 `.exposure-card`。

项目操作流程（可见范围）
- 克隆/拉取后直接编辑 `index.html`，通过浏览器本地打开或临时服务器查看效果。
- 当前默认分支为 `main`（可在仓库主机上确认）；没有发现其他分支策略或提交钩子文件。

需要你提供的信息（如果想让 agent 更高效）
- 是否希望添加构建/打包流程（例如拆分为模块、加入 `package.json`）？
- 是否已有偏好的测试/CI 规范或样式检查（ESLint/Prettier 等）？
- 是否计划将功能拆分到多个源文件（如 `css/`, `js/` 目录）？

注意事项（仅基于可见代码）
- 本说明仅基于仓库可发现的文件，未探测到任何后端或外部 API 集成；若项目实际包含未提交的集成（或私有子模块），请补充信息以便扩展指南。

如果本文件有遗漏或你想补充开发流程（如 npm 脚本、测试命令、CI 配置），请回复要添加的命令或文件路径，我会把它们合并进本指南。
