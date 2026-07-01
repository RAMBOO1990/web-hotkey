# Web Hotkey

一个 Tampermonkey 用户脚本，可在任意网站上自定义键盘快捷键映射。

## 功能

- **按 URL 匹配** — 针对不同网站配置不同的映射规则，支持 `*` 通配符
- **修饰键支持** — Ctrl、Alt、Shift、Meta（⌘/⊞）任意组合
- **按键捕获** — 按下按键即可记录，无需手动输入
- **冲突检测** — 防止同一来源键 + URL 创建重复规则
- **输入保护** — 可选在输入框中禁用映射

## 安装


1. 为你的浏览器安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 一键安装
<a href="https://github.com/RAMBOO1990/web-hotkey/raw/main/web-hotkey.user.js">
  <img src="https://img.shields.io/badge/Install%20from-GitHub-181717?logo=github&style=for-the-badge" alt="从 GitHub 安装" height="36">
</a>

## 使用

1. 点击 Tampermonkey 菜单图标 → **改键配置**（或按 `c` 快捷键）
2. 输入 URL 匹配模式（例如 `https://github.com/*` 或 `*://*.example.com/*`）
3. 点击 **+ 新增规则**
4. 选择修饰键，按下来源键，再按下目标键
5. 点击保存 — 映射立即生效

**URL 匹配** 支持 `*` 通配符，匹配完整的 `location.href`（不仅仅是域名）。

## 兼容性

- Chrome、Firefox、Edge、Safari（需安装 Tampermonkey）
- 无外部依赖
- 单文件自包含 `.user.js` — 无需构建

## 许可证

GPLv3
