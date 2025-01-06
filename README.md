# Emby-Javascript-Details
Add some features for Emby detail page

## 功能：
emby_detail_page.js
   1. 增加一个按钮，复制影片所在文件夹（仅支持Windows）。
   2. 展示剧照（不支持手机）。
      - 部分代码来自于： https://github.com/newday-life/emby-front-end-mod/tree/main/fanart_show
      - 感谢作者：https://github.com/newday-life
      - 用文件名排序
   3. 在“更多类似”下面增加此演员其他作品展示。
      - 如有多个演员，则随机选择其中一个；
      - 如有超过12部作品，则随机选择12部展示。
   4. 新增翻译标题和详情功能。需自行添加google API key
   5. 新增Javdb内容，需要自行修改fetchJavDbFlag
      
trailer_more_button.js
   1. 播放本地trailer时，添加影片源信息和跳转功能
      
list_page.js
   1. list页鼠标悬停自动播放本地trailer （newday-life大神承诺推出但是还没推出的功能）

## 部署服务器方法：
1. 在客户端或网页的 `index.html` <body></body> 标签最后，插入以下内容：
   ```
   <script src="https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js"></script>
   <script type="text/javascript" src="trailer_more_button.js"></script>
   <script type="text/javascript" src="emby_detail_page.js"></script>
   <script type="text/javascript" src="list_page_trailer.js"></script>
   ```
2. 将 `XXX.js` 文件下载放在index.html同级目录中，非window记得授权可读。

   


