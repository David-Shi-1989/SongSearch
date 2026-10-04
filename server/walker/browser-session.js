const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const HOME_URL = 'https://hifiti.com/';
const LOGIN_URL = 'https://hifiti.com/user-login.htm';
const LOGIN_TIMEOUT = 30 * 1000;
const PROFILE_DIR = path.join(__dirname, '.hifiti-chrome-profile');
const ACCOUNT_FILE = path.join(__dirname, '../config/hifiti-account.json');

let browser = null;
let loginPage = null;
let opening = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      if (document.querySelector('a[href*="user-logout"]')) return true;
      if (document.querySelector('#form input[name="password"]')) return false;
      const loginLink = document.querySelector('a.nav-link[href="user-login.htm"], a.nav-link[href*="user-login.htm"]');
      return !loginLink;
    });
  } catch (err) {
    return false;
  }
}

async function launchBrowser() {
  const instance = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: PROFILE_DIR,
    args: ['--start-maximized']
  });
  instance.on('disconnected', () => {
    if (browser === instance) {
      browser = null;
      loginPage = null;
    }
  });
  return instance;
}

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  if (!opening) {
    opening = launchBrowser().finally(() => {
      opening = null;
    });
  }
  browser = await opening;
  return browser;
}

async function getLoginPage() {
  const instance = await getBrowser();
  if (!loginPage || loginPage.isClosed()) {
    const pages = await instance.pages();
    loginPage = pages.find((page) => page.url() && page.url() !== 'about:blank') || pages[0] || await instance.newPage();
  }
  return loginPage;
}

function readAccount() {
  if (!fs.existsSync(ACCOUNT_FILE)) {
    throw new Error('缺少账号文件 server/config/hifiti-account.json');
  }
  const account = JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf8'));
  const username = String(account.username || '').trim();
  const password = String(account.password || '');
  if (!username || !password) {
    throw new Error('请在 server/config/hifiti-account.json 填写 username 和 password');
  }
  return { username, password };
}

async function fillInput(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 20000 });
  await page.focus(selector);
  await page.$eval(selector, (el) => {
    el.value = '';
  });
  await page.type(selector, value, { delay: 15 });
}

async function loginWithAccount(page) {
  const { username, password } = readAccount();
  if (!page.url().includes('user-login')) {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  await fillInput(page, '#email', username);
  await fillInput(page, '#password', password);
  await page.click('#submit');

  const deadline = Date.now() + LOGIN_TIMEOUT;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) return page;
    await sleep(500);
  }
  const message = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.alert, .invalid-feedback'))
      .map((el) => el.innerText.trim())
      .filter(Boolean)
      .join(' ');
  }).catch(() => '');
  throw new Error(message || 'HiFiTi 登录失败，请检查 server/config/hifiti-account.json 中的账号密码');
}

async function ensureLoggedIn() {
  const page = await getLoginPage();
  if (!page.url() || page.url() === 'about:blank') {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  if (await isLoggedIn(page)) return page;
  console.log('正在使用 server/config/hifiti-account.json 登录 HiFiTi');
  return loginWithAccount(page);
}

async function withNewTab(url, handler, options = {}) {
  await ensureLoggedIn();
  const instance = await getBrowser();
  const page = await instance.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.bringToFront();
    return await handler(page);
  } finally {
    if (options.closePage !== false) {
      await page.close().catch(() => {});
    }
  }
}

module.exports = {
  ensureLoggedIn,
  withNewTab,
  isLoggedIn
};
