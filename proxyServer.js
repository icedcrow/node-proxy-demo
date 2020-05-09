const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');

const httpProxy = require('http-proxy');
const express = require('express');
const send = require('send');

const expressHttpPort = 8001;
const expressHttpsPort = 8002;
const proxyServerPort = 9001;

// 假定使用代理后，将这个地址替换成本地的index.html
const incomeHTMLPath = 'https://github.com/somepath';

// https证书
const ssl = {
  key: fs.readFileSync('./proxyKey.pem', 'utf8'),
  cert: fs.readFileSync('./proxyCert.pem', 'utf8'),
};

// 分析请求地址
// 使用本地文件替换，或者使用外网资源
const app = express();
app.all('*', (req, res) => {
  const requestUrl = `${req.protocol}://${req.headers.host}${req.url}`;
  const parsedUrl = new URL(requestUrl);
  const requestPath = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;

  const filename =
    requestPath === incomeHTMLPath
      ? 'index.html'
      : path.basename(parsedUrl.pathname);
  const filepath = path.resolve(`./static/${filename}`);

  try {
    // 优先用本地文件替换
    fs.accessSync(filepath, fs.constants.R_OK);
    send(req, filepath).pipe(res);
  } catch (e) {
    // 本地文件读取不了的话就请求外网实际资源
    const proxy = httpProxy.createProxyServer();
    proxy.web(req, res, {
      target: `${req.protocol}://${req.headers.host}`,
    });
  }
});

// 监听http和https
http.createServer(app).listen(expressHttpPort);
https.createServer(ssl, app).listen(expressHttpsPort);

// 搭建代理服务器
const proxyServer = http.createServer(ssl, (req, res) => {
  // http的请求在这边处理
  // 直接转发到本地的express的http端口
  const proxy = httpProxy.createProxyServer();
  proxy.web(req, res, {
    target: `http://127.0.0.1:${expressHttpPort}`,
  });
});
proxyServer.on('connect', (req, socket, head) => {
  // 这边处理https请求
  // 连接到express的https端口
  const proxySocket = new net.Socket();
  proxySocket.connect({ port: expressHttpsPort }, () => {
    socket.write(`HTTP/${req.httpVersion} 200 Connection established\r\n\r\n`);
  });
  proxySocket.on('data', (chunk) => {
    socket.write(chunk);
  });
  proxySocket.on('end', () => {
    socket.end();
  });
  proxySocket.on('error', () => {
    socket.write(`HTTP/${req.httpVersion} 500 Connection error\r\n\r\n`);
    socket.end();
  });

  socket.on('data', (chunk) => {
    proxySocket.write(chunk);
  });
  socket.on('end', () => {
    proxySocket.end();
  });
  socket.on('error', () => {
    proxySocket.end();
  });
});
proxyServer.listen(proxyServerPort);
