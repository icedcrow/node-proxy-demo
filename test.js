const puppeteer = require('puppeteer');

// 代理服务器的地址
const proxyServerPort = 9001;

// 假设访问这个地址，html将会被本地文件替换
const testUrl = 'https://github.com/somepath?a=1&b=2';

(async () => {
  // 启用puppeteer访问，并使用代理服务器
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', `--proxy-server=127.0.0.1:${proxyServerPort}`],
  });
  const page = await browser.newPage();
  await page.goto(testUrl);
  await page.screenshot({ path: './test-result.png' });
  await browser.close();
})();
