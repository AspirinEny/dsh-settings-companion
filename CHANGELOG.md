# Changelog

本项目的所有重要变更都记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-10-27

### Added

- `locale/en.json`、`locale/zh.json` 的 `meta.title` / `meta.description`，插件列表与详情页可正确显示名称和说明。
- 原创 `icon.svg`（8 齿齿轮），随包导出 `./icon`。
- `scripts/verify.mjs`：校验清单、locale、`files` 完整性、图标格式与体积、JS 语法。
- `scripts/pack.mjs`：零依赖打 `dist/<name>-<version>.tgz`，与 `npm pack` 的 `files` 语义一致。
- GitHub Actions：CI 校验 + 打标签自动发布 tarball。

### Changed

- 改为通过 Client locale 服务提供文案（命名空间 `settings.companion`），语言切换即时生效，不再硬编码中文。
- 齿轮图标改为复制官方 `IconSettingsOutlineMedium` 的两条 path 数据，不再 `require` 任何 Harness Client 包。
- 观看账号行的方式从 800ms 轮询改为 `MutationObserver`（仅在行尚未出现时保留一次短轮询兜底）。
- `<style>` 随组件一起 portal 进账号行，不再向 `document.head` 追加节点。
- 打开设置改用 `shortcuts` 服务的 `settings.open` 命令（`modal: null` 表示打开而非切换），仅在服务缺失时回退到合成 `Ctrl+,`。
- 点击守卫由布尔状态改为时间戳，事件目标取 `currentTarget` 而非 `document.activeElement`。

## [0.1.0] - 2026-10-26

### Added

- 首个版本：在侧边栏账号行右侧增加「齿轮 + 设置」一栏，点击打开设置面板。
- 借用官方账号按钮的 CSS-module 类名，使高度、圆角、配色、hover、收窄态与账号行保持一致。
- 兼容未登录（`data-signed-out`）与折叠（`data-collapsed`）两种官方状态。
