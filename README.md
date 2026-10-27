# dsh-settings-companion

[![version](https://img.shields.io/badge/version-0.2.0-4d6bfe)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![platform](https://img.shields.io/badge/platform-DSH%20desktop%20%C2%B7%20web%20client-8a8a8a)](#兼容性)

给 **DeepSeek Harness（DSH）桌面版**的侧边栏账号行加一栏「齿轮 + 设置」，点一下直接打开设置面板——不用再点头像、再从菜单里挑「设置」。

账号行会变成左右两栏：左边保持原样的头像 + 账号名（点开仍是原来的账号菜单），右边是新增的齿轮 + 文字设置。

> 截图待补：本仓库目前没有附界面截图，请以本机实际效果为准。

## 功能

- **一键进设置**：调用 `shortcuts` 服务的 `settings.open` 命令，是真正的"菜单项点击"语义，不走模拟按键。
- **外观跟随官方**：运行时读取账号按钮的 CSS-module 类名并复用，高度、圆角、配色、hover、聚焦环、折叠成 36×36、未登录 32px 等状态全部继承官方样式表。
- **文案走 locale**：注册 `settings.companion` 命名空间（en / zh），切换语言即时生效。
- **图标同源**：齿轮的路径数据复制自官方 `IconSettingsOutlineMedium`，视觉与账号菜单里的「设置」一致。
- **零依赖**：不 `require` 任何 Harness Client 包，也不引入第三方运行时依赖。

## 安装

> 需要 DSH **桌面版**（左下角有账号行）。安装后必须**完全退出并重启** DSH 才生效——改的是客户端 bundle，`Ctrl+R` 只会重载页面，不会重载 JS 模块代。

### 方式 A：界面里选本地目录

1. 下载 Release 里的 `dsh-settings-companion-<version>.zip`（或克隆本仓库），解压到**以后不会移动的位置**，例如 `D:\DSH-Plugins\dsh-settings-companion`；
2. DSH → 设置 → 插件 → 从本地安装 → 选择该目录（**选 `package.json` 所在的那一层**）；
3. 重启 DSH。

这种方式 pnpm 会记成 `link:` + 目录联接（Junction），**源目录移动或删除后插件失效**，适合自己开发迭代。

### 方式 B：命令行安装 tarball（推荐分发）

```powershell
# Windows 默认安装路径下的 CLI
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add "C:\path\to\dsh-settings-companion-0.2.0.tgz"
```

`dsh plugin` 会把参数原样转发给 profile 目录里的 pnpm。tarball 安装会把文件**真实复制**进 `~/.dsh/profiles/desktop/node_modules/`，与源文件脱钩。

自己打一个 tarball：

```powershell
node scripts/pack.mjs   # 产出 dist/dsh-settings-companion-<version>.tgz
```

### 方式 C：从源码链接（开发）

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop add "C:\path\to\dsh-settings-companion"
```

改完 `lib/client.js` 重启 DSH 即可看到效果，无需重装。

## 卸载

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" `
  plugin --profile desktop remove dsh-settings-companion
```

或在设置 → 插件里移除该 bundle，然后重启。

## 兼容性

- 面向 **DSH 桌面版**；Web 版没有账号行，插件不会渲染任何内容（静默跳过）。
- 插件依赖两处官方实现细节，上游改动时**视觉会退化但不会崩**：
  - 槽位名 `settings.launcher`：账号行所在的 `single` 槽位，找不到时不渲染；
  - 账号按钮的 CSS-module 类名后缀（`*_trigger` / `*_label`）：找不到时回退到插件自带的兜底样式。
- 未在 DSH 之外的其他客户端验证过。

## 工作原理

`settings.launcher` 是 `single` 型槽位，官方 `AccountMenu` 永远是第一个注册者，后注册者无法顶替它——所以"把账号行换成齿轮"用槽位做不到。本插件的做法是：

1. 向 `sidebar.footer.action`（`list` 型槽位，可安全多注册）注册一个渲染 `null` 的条目，仅用于拿到组件生命周期；
2. 组件通过 `MutationObserver` 等账号行出现，然后用 `react-dom` 把「齿轮 + 设置」portal 进该行；
3. 用 `:has(> [data-slot="settings.launcher"])` + `display:contents` 把官方行改成两栏 flex；
4. 点击时 `ctx.get("shortcuts").registry.invoke("settings.open", { target, region: "page", modal: null })`，`modal: null` 表示"打开"而不是"切换"。

这也是为什么它刻意不像常规插件那样"只注册槽位"——文件头注释里记了这个取舍。

## 开发

```
dsh-settings-companion/
├── lib/
│   ├── index.js          # Host 侧：空插件，负责被 cordis 加载
│   └── client.js         # 全部逻辑：槽位注册、portal 双栏、样式、locale
├── locale/{en,zh}.json   # 展示元数据（meta.title / meta.description）
├── icon.svg              # 插件图标（8 齿齿轮，与界面图标同源）
├── cordis.patch.yml      # bundle 的插入补丁
├── scripts/verify.mjs    # 规范校验：清单 / locale / files / 图标 / 语法
└── scripts/pack.mjs      # 零依赖打包（纯 JS 写 ustar + gzip）
```

```powershell
node scripts/verify.mjs   # 提交前必跑
node scripts/pack.mjs     # 产出 dist/*.tgz
```

`verify.mjs` 会检查：清单字段与 `exports`、`dsh.bundle.patch` 是否存在、`dsh.client.platform`、每个 locale 的 `meta` 字段且 Client bundle 里注册了对应语言、`files` 是否覆盖全部运行时文件、图标是否为受支持格式且 ≤256 KiB、以及所有 JS 的 `node --check`。

## 许可

[MIT](LICENSE)。图标为原创；齿轮路径数据复制自 DSH 自带的 `IconSettingsOutlineMedium`，仅用于保持界面一致。
