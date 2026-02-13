# Emby-Javascript-Details

为 Emby 媒体库系统的详情页、列表页和演员页面增加实用功能的 JavaScript 脚本集合。


---

## 📋 目录

- [核心功能](#核心功能)
- [脚本说明](#脚本说明)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [功能展示](#功能展示)
- [常见问题](#常见问题)
- [相关链接](#相关链接)

---

## 🚀 核心功能

| 功能 | 说明 |
|------|------|
| **随机推荐** | “更多类似”内容增加随机性 |
| **剧照展示** | 详情页高清剧照，支持排序 |
| **演员 / 导演作品** | 展示相关作品 |
| **标题翻译** | Google API 翻译 |
| **Javdb 内容加载** | 加载 Javdb 信息 |
| **Trailer 自动播放** | 列表页悬停播放 |
| **Trailer 增强** | 显示源信息 |

---

## 📁 脚本说明

### 1. emby_detail_page.js（核心）
- 推荐内容随机化
- 高清剧照展示
- 演员 / 导演作品展示
- 标题/简介翻译
- Javdb 内容集成
- 合集页增加添加影片功能

### 2. trailer_more_button.js
- Trailer 增强显示

### 3. list_page_trailer.js
- 列表页 Trailer 自动播放

### 4. actor_page.js
- 演员页增强
  
### 5. config.json
- 配置文件（OpenAI API Key 等）

---

## ⚡ 快速开始

### 方式 1️⃣ 本地服务器部署

1. 下载项目中的所有 `.js` 文件  
2. 修改各脚本顶部的 `user config`  
3. 在 Emby 的 `index.html` 的 `</body>` 前插入：

   ```html
   <script src="trailer_more_button.js"></script>
   <script src="emby_detail_page.js"></script>
   <script src="list_page_trailer.js"></script>
   <script src="actor_page.js"></script>
   ```

4. 将所有 `.js` 文件放在 `index.html` 同级目录  
5. 将 `config.json` 放在 `index.html` 同级目录  

---

### 方式 2️⃣ 使用 Emby.CustomCssJS（推荐）

使用 [Emby.CustomCssJS](https://github.com/Shurelol/Emby.CustomCssJS) 统一管理脚本。

---

### 方式 3️⃣ Docker 一键部署

```bash
bash <(curl -s https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/install/patch.sh)
```

---

## ⚙️ 配置说明

```javascript
// ==================== user config ====================
var openaiApiKey = "";
var nameMap = {};
var fetchJavdbImg = true;
// ====================================================
```

```json
{
  "openaiApiKey": "",
  "nameMap": {},
  "prefixDic": {}
}
```

---

## 📸 功能展示

![fanart](images/fanart_new.png)
![modal](images/modal.png)
![actorMore](images/actorMore_new.png)

---

## 💡 常见问题

**Q: 脚本之间有依赖关系吗？**  
A: 没有，可以独立使用，推荐安装 `emby_detail_page.js`。

**Q: 支持哪些 Emby 版本？**  
A: 已测试 Emby 4.9+。

---

## 🔗 相关链接

- https://github.com/newday-life/emby-front-end-mod
- https://github.com/newday-life/emby-web-mod
- https://github.com/sqzw-x/mdcx
- https://github.com/Shurelol/Emby.CustomCssJS

---



**最后更新：2025 年 12 月**
