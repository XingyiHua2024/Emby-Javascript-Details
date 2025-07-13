# Emby-Javascript-Details
Add some features for Emby detail page

## 功能：
### emby_detail_page.js
   1. 新功能：“更多类似”内容增加随机性
      - 每次刷新后的推荐内容随机
   2. 展示剧照
      - 部分代码来自于：https://github.com/newday-life/emby-front-end-mod/tree/main/fanart_show
      - 感谢作者：https://github.com/newday-life
      - 用文件名排序
      - ![fanart](images/fanart_new.png)
      - ![modal](images/modal.png)
   3. 在“更多类似”下面增加此演员及导演其他作品展示。
      - 如有多个演员，则随机选择其中一个；
      - 如有超过12部作品，则随机选择12部展示。
      - ![Screenshot](images/actorMore.png)
   4. 翻译标题和详情功能。
      - 需自行添加 google API key
   5. 加载Javdb内容。
      - 在文件开头修改user config (不再依赖config.json)
      - 结合 MDCx 使用：https://github.com/sqzw-x/mdcx
      - 新增加载短评功能
      
### trailer_more_button.js

1. 播放本地trailer时，添加影片源信息和跳转功能

## Before

![before](images/trailer_before.png)

## After

![after](images/trailer_after.png)
      
### list_page.js
   1. list页鼠标悬停自动播放本地trailer （alternative: https://github.com/newday-life/emby-web-mod/tree/main/trailer ）

### actor_page.js
   1. 加载javdb演员/导演结果

### emby-swiper-trailer.js
   1. 来自：https://github.com/newday-life/emby-web-mod/blob/main/emby-swiper/emby-swiper-trailer
   2. 将Youtube trailer修改为本地trailer

### config.json
   1. save configs. 必须放在index.html同级目录中
   2. google API key （选填。不添加不会触发翻译功能）
   3. 也可以直接在js文件中修改相应config


## 部署服务器方法 1：
1. 在客户端或网页的 `index.html` <body></body> 标签最后，插入以下内容：
   ```
   <script type="text/javascript" src="trailer_more_button.js"></script>
   <script type="text/javascript" src="emby_detail_page.js"></script>
   <script type="text/javascript" src="list_page_trailer.js"></script>
   <script type="text/javascript" src="actor_page.js"></script>
   ```
2. 将 `XXX.js` 文件下载放在index.html同级目录中，非window记得授权可读。
3. 将修改后的 `config.json` 文件放在index.html同级目录中。

## 部署服务器方法 2：
配合Emby自定义JavaScript及Css项目：https://github.com/Shurelol/Emby.CustomCssJS 

## 部署服务器方法 3（仅适用于 Docker 用户）：
1. 确保 Docker 容器正在运行，并记住容器名称（默认是 linuxserver_emby）
2. 在你的 Linux 服务器上运行以下命令
   ```
   bash <(curl -s https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/install/patch.sh)
   ```
3. 如添加失败，须加入自定义参数运行（正确修改自定义参数，如容器名、容器web路径、JS列表、配置文件等）：
   ```
   CONTAINER_NAME=linuxserver_emby \
   CONTAINER_WEB_FOLDER=/app/emby/system/dashboard-ui \
   JS_FILES="emby_detail_page.js list_page_trailer.js actor_page.js trailer_more_button.js" \
   CONFIG_FILE=./my_config.json \
   bash <(curl -s https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/install/patch.sh)
   ```
   


