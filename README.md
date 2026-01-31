# Emby-Javascript-Details

为 Emby 媒体库系统的 **详情页 / 列表页 / 演员页面** 增加实用功能的 JavaScript 脚本集合。

**[English](#english) | [中文](#中文)**

---

## 中文

## 📋 目录

- [核心功能](#-核心功能)
- [脚本说明](#-脚本说明)
- [快速开始](#-快速开始)
- [配置说明](#️-配置说明)
- [功能展示](#-功能展示)
- [常见问题](#-常见问题)
- [相关链接](#-相关链接)

---

## 🚀 核心功能

| 功能 | 说明 |
|------|------|
| **随机推荐** | “更多类似”内容增加随机性，每次刷新推荐不同内容 |
| **剧照展示** | 在详情页显示高清剧照，支持按文件名排序 |
| **演员 / 导演作品** | 在“更多类似”下展示选中演员或导演的其他作品 |
| **标题翻译** | 支持多语言翻译（需配置 Google API Key） |
| **Javdb 内容加载** | 加载并显示 Javdb 上的相关内容和短评 |
| **本地 Trailer 播放** | 列表页鼠标悬停自动播放本地 trailer |
| **Trailer 增强** | 播放本地 trailer 时添加影片源信息和跳转功能 |

---

## 📁 脚本说明

### emby_detail_page.js（详情页增强 ⭐ 核心脚本）

**功能：**

- 推荐内容随机化，提高内容多样性
- 高清剧照展示  
  - 参考代码：[emby-front-end-mod](https://github.com/newday-life/emby-front-end-mod/tree/main/fanart_show)
  - 感谢作者：[@newday-life](https://github.com/newday-life)
  - 支持按文件名自动排序
- 演员 / 导演作品展示  
  - 多个演员时随机选择一个  
  - 超过 12 部作品时随机取 12 部
- 标题和描述翻译（需 Google API）
- Javdb 内容集成  
  - 需在文件顶部修改 user config  
  - 结合 [MDCx](https://github.com/sqzw-x/mdcx) 使用效果更佳

---

### trailer_more_button.js（Trailer 增强）

**功能：**

- 播放本地 trailer 时添加影片源信息
- 提供快速跳转
- 支持 Before / After 对比展示

---

### list_page_trailer.js（列表页 Trailer 自动播放）

**功能：**

- 列表页鼠标悬停自动播放本地 trailer
- 参考项目：[emby-web-mod/trailer](https://github.com/newday-life/emby-web-mod/tree/main/trailer)

---

### actor_page.js（演员页增强）

**功能：**

- 在演员页面加载并显示 Javdb 上的演员 / 导演相关结果

---

### emby-swiper-trailer.js（首页 Trailer 轮播）

**功能：**

- 首页实现流畅的 trailer 轮播展示
- 来源：[emby-web-mod](https://github.com/newday-life/emby-web-mod/blob/main/emby-swiper/emby-swiper-trailer)
- 已适配新版本 Emby

---

### emby-swiper-localtrailer.js（首页本地 Trailer 轮播）

**功能：**

- 首页播放本地 trailer 轮播
- 支持 Emby 4.9+

---

### config.json（配置文件）

**说明：**

- 必须放在 `index.html` 同级目录
- 配置项：Google API Key（可选）
- 也可直接在 JS 文件中修改配置

---

## ⚡ 快速开始

### 方式 1️⃣ 本地服务器部署

1. 下载所有 `.js` 文件
2. 根据需要修改脚本顶部 `user config`
3. 在 `index.html` 的 `</body>` 前插入：

```html
<script src="trailer_more_button.js"></script>
<script src="emby_detail_page.js"></script>
<script src="list_page_trailer.js"></script>
<script src="actor_page.js"></script>
