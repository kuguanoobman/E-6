# 曝光标尺工具（亚当斯区域曝光法）

轻量静态前端小工具，全部实现集中在单文件/拆分后的静态资源中，主要用于横屏交互体验。

快速开始
- 克隆或拉取项目后，在项目根目录打开 PowerShell 并运行：

```powershell
py start-server.py
```

- 启动后在浏览器打开：
  - 本机：http://127.0.0.1:8000
  - 手机（同一 Wi‑Fi）：http://192.168.1.xxx:8000（替换为你的电脑 IPv4，可用 `ipconfig` 查询）

- 编辑文件后刷新浏览器即可看到更改（无自动刷新）。

- 停止服务器：在终端按 Ctrl+C。

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

本地与手机访问（常见问题与示例）

- 如果浏览器提示 “localhost 拒绝连接”，先尝试访问 IPv4 地址：

```text
http://127.0.0.1:8000
```

  原因：某些系统/浏览器会把 `localhost` 解析为 IPv6 `::1`，而临时服务器可能只绑定到 IPv4 `127.0.0.1`。用 `127.0.0.1` 能快速验证服务是否正常。

- 从手机访问（同一局域网）示例：

  1. 在 PowerShell 中查看本机 IPv4 地址：

```powershell
ipconfig
# 在输出中找到你正在使用的网络连接下的 IPv4 地址，例如 192.168.1.42
```

  2. 在项目根目录以监听所有接口启动服务器：

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

  3. 在手机浏览器中访问（替换为你的电脑 IPv4）：

```text
http://192.168.1.42:8000
```

  说明：如果还是无法访问，Windows 防火墙可能阻止了外部连接（仅当你绑定 `0.0.0.0` 并希望局域网设备访问时才需要修改防火墙）。添加入站规则的示例（以管理员身份运行 PowerShell）：

```powershell
New-NetFirewallRule -DisplayName "Allow Python HTTP 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

- 一般调试建议：先在本地用 `http://127.0.0.1:8000` 验证页面，然后再切换到 `--bind 0.0.0.0` + 局域网 IP 做手机调试。

如需我把项目改造为带构建流程或增加测试，请回复你想要的工具链（例如 `vite` / `parcel` / `webpack` / `esbuild`）和是否需要 TypeScript。
