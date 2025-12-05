# 曝光标尺工具（亚当斯区域曝光法）

轻量静态前端小工具，全部实现集中在单文件/拆分后的静态资源中，主要用于横屏交互体验。

运行
- 直接在浏览器中打开 `index.html`（推荐横屏或将浏览器窗口调整为横向）。
- 使用临时本地服务器（推荐，当你想使用外部 devtools 或避免 CORS 问题）：

  - Python (PowerShell):

```powershell
python -m http.server 8000
# 然后访问 http://localhost:8000
```

  - Node (临时)：

```powershell
npx serve .
```

项目结构（已拆分）

- `index.html`：页面主体，引用外部 CSS/JS。
- `css/style.css`：视图样式（从原 `index.html` 提取）。
- `js/app.js`：交互逻辑（从原 `index.html` 提取）。

重要常量/约定（请在修改时同步）
- EV 列数与宽度：11 列，单列宽 `60px`（由 `css/style.css` 中 `calc(11 * 60px)` 与 `js/app.js` 中 `CELL_WIDTH` 保持一致）。
- 卡片布局：`CARD_COUNT = 9`、`CARD_WIDTH = 58`、`CARD_GAP = 10`；卡片初始位置由 `CARD_INITIAL_POSITIONS` 计算生成。
- 横竖屏：页面在竖屏会隐藏主视图（CSS media query `(orientation: portrait)`），开发时请在横屏下检验交互。

常见修改示例
- 为卡片添加字段：修改 `js/app.js` 的 `generateExposureCards()` 并在 `css/style.css` 中添加样式，必要时更新 `resetCardsContent()`。
- 修改列数/列宽：同时修改 `css/style.css` 的 `calc(11 * 60px)`（以及其他出现的 `11`/`60`）和 `js/app.js` 顶部常量 `EV_VALUES`/`CELL_WIDTH`/`TABLE_TOTAL_WIDTH`。

开发者提示
- 本仓库无构建工具；若你想拆分为模块化开发或加入 npm 脚本，我可以创建 `package.json`、开发脚本与一个简单的本地 serve 命令。

如需我把项目改造为带构建流程或增加测试，请回复你想要的工具链（例如 `vite` / `parcel` / `webpack` / `esbuild`）和是否需要 TypeScript。
