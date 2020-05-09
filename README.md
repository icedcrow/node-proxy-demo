# 用 node 做 http 正向代理服务器并优先使用本地资源

对最近要做的一个东西进行一些试验，各种失败后终于跑通，写一个 demo 作为记录

目前要做的效果是：

1. 访问某个外网 html 的时候，代理到本地，使用本地的 html 文件来替换
2. 这个 html 里有一些外网资源，如果本地有存在同名的资源，则用本地资源替换，否则依旧使用外网资源

## 测试

先 `npm install`

启动代理服务器

```bash
node proxyServer.js
```

再开一个 puppeteer 挂代理去访问试试

```bash
node test.js
```

可以看到生成 test-result.png 这个页面截图，访问的是 github，但是实际使用了本地 html，并且页面上的 google 的图片被换成了百度

### 自签证书

这边是用[mkcert](https://github.com/FiloSottile/mkcert)来生成`proxyCert.pem`和`proxyKey.pem`的

```bash
mkcert -key-file proxyKey.pem -cert-file proxyCert.pem localhost 127.0.0.1 ::1
```
