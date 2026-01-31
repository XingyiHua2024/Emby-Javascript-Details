# Emby-Javascript-Details

为 Emby 媒体库系统的详情页、列表页和演员页面增加实用功能的 JavaScript 脚本集合。

**[English](#english) | [中文](#中文)**

---

## 中文

### 📋 目录

- [核心功能](#核心功能)
- - [脚本说明](#脚本说明)
  - - [快速开始](#快速开始)
    - - [部署方法](#部署方法)
      - - [配置说明](#配置说明)
       
        - ### 🚀 核心功能
       
        - | 功能 | 说明 |
        - |------|------|
        - | **随机推荐** | "更多类似"内容增加随机性，每次刷新推荐不同内容 |
        - | **剧照展示** | 在详情页显示高清剧照，支持按文件名排序 |
        - | **演员/导演作品** | 在"更多类似"下展示选中演员或导演的其他作品 |
        - | **标题翻译** | 支持多语言翻译（需配置 Google API Key） |
        - | **Javdb 内容加载** | 加载并显示 Javdb 上的相关内容和短评 |
        - | **本地 Trailer 播放** | 列表页鼠标悬停自动播放本地 trailer |
        - | **Trailer 增强** | 播放本地 trailer 时添加影片源信息和跳转功能 |
       
        - ### 📁 脚本说明
       
        - #### 1. **emby_detail_page.js** - 详情页增强 ⭐ 核心脚本
       
        - **功能：**
        - - 推荐内容随机化：每次刷新后的推荐内容会随机变化，提高内容多样性
          - - 高清剧照展示：加载并显示电影/电视剧的剧照
            -   - 部分代码参考：[emby-front-end-mod](https://github.com/newday-life/emby-front-end-mod/tree/main/fanart_show)
                -   - 感谢作者：[@newday-life](https://github.com/newday-life)
                    -   - 支持按文件名自动排序
                        - - 演员/导演作品展示：在"更多类似"下显示所选演员或导演的其他作品
                          -   - 多个演员时随机选择一个
                              -   - 超过 12 部作品时随机选择 12 部
                                  - - 标题和描述翻译：支持从日语翻译至其他语言（需配置 Google API）
                                    - - Javdb 内容集成：加载相关的 Javdb 信息，包括短评功能
                                      -   - 需在文件顶部修改 user config（不依赖 config.json）
                                          -   - 结合 [MDCx](https://github.com/sqzw-x/mdcx) 使用效果更佳
                                           
                                              - #### 2. **trailer_more_button.js** - Trailer 增强
                                           
                                              - **功能：**
                                              - - 播放本地 trailer 时添加影片源信息和快速跳转功能
                                                - - 显示 Before/After 对比效果
                                                 
                                                  - #### 3. **list_page_trailer.js** - 列表页 Trailer 自动播放
                                                 
                                                  - **功能：**
                                                  - - 列表页鼠标悬停时自动播放本地 trailer
                                                    - - 参考项目：[emby-web-mod/trailer](https://github.com/newday-life/emby-web-mod/tree/main/trailer)
                                                     
                                                      - #### 4. **actor_page.js** - 演员页增强
                                                     
                                                      - **功能：**
                                                      - - 在演员页面加载并显示 Javdb 上的演员/导演相关结果
                                                       
                                                        - #### 5. **emby-swiper-trailer.js** - 首页 Trailer 轮播
                                                       
                                                        - **功能：**
                                                        - - 首页实现流畅的 trailer 轮播展示
                                                          - - 来源：[emby-web-mod](https://github.com/newday-life/emby-web-mod/blob/main/emby-swiper/emby-swiper-trailer)
                                                            - - 已适配新版本 Emby
                                                             
                                                              - #### 6. **emby-swiper-localtrailer.js** - 首页本地 Trailer 轮播
                                                             
                                                              - **功能：**
                                                              - - 首页播放本地 trailer 轮播
                                                                - - 支持本地 trailer，已适配 Emby 4.9+
                                                                 
                                                                  - #### 7. **config.json** - 配置文件
                                                                 
                                                                  - **说明：**
                                                                  - - 必须放在 `index.html` 同级目录中
                                                                    - - 配置项：Google API Key（可选，不添加则不触发翻译功能）
                                                                      - - 也可直接在 JS 文件中修改相应配置
                                                                       
                                                                        - ---

                                                                        ### ⚡ 快速开始

                                                                        根据你的部署方式选择对应的方法：

                                                                        #### 方式 1️⃣ 本地服务器部署

                                                                        **步骤：**

                                                                        1. **下载脚本文件**：将项目中的所有 `.js` 文件下载到本地
                                                                        2. 2. **配置脚本**：根据需要在各脚本文件顶部修改 user config，如需翻译功能，添加 Google API Key 到 `config.json`
                                                                           3. 3. **注入到 Emby 页面**：在 Emby 的 `index.html` 文件末尾 `</body>` 标签前插入：
                                                                             
                                                                              4. ```html
                                                                                 <script type="text/javascript" src="trailer_more_button.js"></script>
                                                                                 <script type="text/javascript" src="emby_detail_page.js"></script>
                                                                                 <script type="text/javascript" src="list_page_trailer.js"></script>
                                                                                 <script type="text/javascript" src="actor_page.js"></script>
                                                                                 ```

                                                                                 4. **文件位置**：将下载的文件放在 `index.html` 同级目录中。非 Windows 系统需授予可读权限
                                                                                 5. 5. **配置文件**：将修改后的 `config.json` 放在 `index.html` 同级目录中
                                                                                   
                                                                                    6. #### 方式 2️⃣ 配合自定义 JS/CSS 项目（推荐）
                                                                                   
                                                                                    7. 使用 [Emby.CustomCssJS](https://github.com/Shurelol/Emby.CustomCssJS) 项目来管理脚本，更便于维护和版本管理。
                                                                                   
                                                                                    8. #### 方式 3️⃣ Docker 一键部署（最简单）✨
                                                                                   
                                                                                    9. **前提条件：**
                                                                                    10. - Docker 容器正在运行
                                                                                        - - 记住容器名称（默认：`linuxserver_emby`）
                                                                                         
                                                                                          - **基础命令（推荐）：**
                                                                                         
                                                                                          - ```bash
                                                                                            bash <(curl -s https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/install/patch.sh)
                                                                                            ```

                                                                                            脚本会自动检测并配置默认参数。

                                                                                            **自定义参数命令：**

                                                                                            如果上述命令失败，或你需要自定义配置，使用以下命令并修改相应参数：

                                                                                            ```bash
                                                                                            CONTAINER_NAME=linuxserver_emby \
                                                                                            CONTAINER_WEB_FOLDER=/app/emby/system/dashboard-ui \
                                                                                            JS_FILES="emby_detail_page.js list_page_trailer.js actor_page.js trailer_more_button.js" \
                                                                                            CONFIG_FILE=./my_config.json \
                                                                                            bash <(curl -s https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/install/patch.sh)
                                                                                            ```

                                                                                            **参数说明：**
                                                                                            - `CONTAINER_NAME`: Docker 容器名称
                                                                                            - - `CONTAINER_WEB_FOLDER`: 容器内 Emby web 页面的路径
                                                                                              - - `JS_FILES`: 要安装的 JS 脚本列表（空格分隔）
                                                                                                - - `CONFIG_FILE`: 配置文件路径
                                                                                                 
                                                                                                  - ---

                                                                                                  ### ⚙️ 配置说明

                                                                                                  #### 通用配置方法

                                                                                                  每个脚本的顶部都有 `user config` 注释块，你可以直接修改这些配置：

                                                                                                  ```javascript
                                                                                                  // ==================== user config ====================
                                                                                                  var googleApiKey = ""; // 你的 Google API Key
                                                                                                  var nameMap = {}; // 名称映射
                                                                                                  var fetchJavdbImg = true; // 是否加载 Javdb 图片
                                                                                                  // ====================================================
                                                                                                  ```

                                                                                                  #### Google API Key 配置（翻译功能）

                                                                                                  1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
                                                                                                  2. 2. 创建项目并启用 Translate API
                                                                                                     3. 3. 生成 API Key
                                                                                                        4. 4. 将 Key 添加到脚本配置中
                                                                                                          
                                                                                                           5. #### config.json 配置
                                                                                                          
                                                                                                           6. ```json
                                                                                                              {
                                                                                                                "googleApiKey": "",
                                                                                                                "nameMap": {},
                                                                                                                "prefixDic": {}
                                                                                                              }
                                                                                                              ```
                                                                                                              
                                                                                                              ---
                                                                                                              
                                                                                                              ### 📸 功能展示
                                                                                                              
                                                                                                              **剧照展示：** ![fanart](images/fanart_new.png)
                                                                                                              
                                                                                                              **详情模态框：** ![modal](images/modal.png)
                                                                                                              
                                                                                                              **演员作品展示：** ![actorMore](images/actorMore_new.png)
                                                                                                              
                                                                                                              **Trailer 增强前后对比：**
                                                                                                              - Before: ![before](images/trailer_before.png)
                                                                                                              - - After: ![after](images/trailer_after.png)
                                                                                                               
                                                                                                                - ---
                                                                                                                
                                                                                                                ### 💡 常见问题
                                                                                                                
                                                                                                                **Q: 脚本之间有依赖关系吗？**
                                                                                                                A: 没有。可以独立使用，也可以全部安装。建议至少安装 `emby_detail_page.js` 以获得最佳体验。
                                                                                                                
                                                                                                                **Q: 如何禁用某个功能？**
                                                                                                                A: 在脚本顶部的 user config 中修改相应参数，或注释掉不需要的脚本。
                                                                                                                
                                                                                                                **Q: 支持哪些 Emby 版本？**
                                                                                                                A: 已测试并支持 Emby 4.9+ 版本。
                                                                                                                
                                                                                                                **Q: 翻译功能不工作？**
                                                                                                                A: 确保已配置有效的 Google API Key，且已启用 Translate API。
                                                                                                                
                                                                                                                ---
                                                                                                                
                                                                                                                ### 📝 相关链接
                                                                                                                
                                                                                                                - [emby-front-end-mod](https://github.com/newday-life/emby-front-end-mod) - 剧照功能参考
                                                                                                                - - [emby-web-mod](https://github.com/newday-life/emby-web-mod) - Trailer 轮播参考
                                                                                                                  - - [MDCx](https://github.com/sqzw-x/mdcx) - 元数据刮削工具
                                                                                                                    - - [Emby.CustomCssJS](https://github.com/Shurelol/Emby.CustomCssJS) - 自定义 CSS/JS 管理
                                                                                                                     
                                                                                                                      - ---
                                                                                                                      
                                                                                                                      ### 🤝 贡献和反馈
                                                                                                                      
                                                                                                                      欢迎 Fork、提交 Issue 和 Pull Request！
                                                                                                                      
                                                                                                                      ---
                                                                                                                      
                                                                                                                      ## English
                                                                                                                      
                                                                                                                      > Coming soon. Welcome to contribute!
                                                                                                                      >
                                                                                                                      > ---
                                                                                                                      >
                                                                                                                      > **最后更新：** 2025 年 12 月
                                                                                                                      > 
