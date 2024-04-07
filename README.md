# Emby-Javascript-Details
Add some features for Emby detail page

## 三大功能：
1. 增加一个按钮，复制影片所在文件夹（仅支持Windows）。
2. 展示剧照（不支持手机）。
   - 部分代码来自于： https://github.com/newday-life/emby-front-end-mod/tree/main/fanart_show
   - 感谢作者：https://github.com/newday-life
   - 增加一个调节照片大小的slide bar
3. 在“更多类似”下面增加此演员其他作品展示。
   - 如有多个演员，则随机选择其中一个；
   - 如有超过12部作品，则随机选择12部展示。

## 部署服务器方法：
1. 修改 my_server_update.py 设置，并在py文件同路径下运行。
   ```
   python my_server_update.py
   ```
2. a. 在客户端或网页的 `index.html` <body></body> 标签最后，插入以下内容：
   ```
   <script type="text/javascript" src="XXX.js"></script> 
   ```
   b. 将 `XXX.js` 文件下载放在index.html同级目录中，非window记得授权可读。
3. 配合Emby自定义JavaScript及Css项目：https://github.com/Shurelol/Emby.CustomCssJS
   


