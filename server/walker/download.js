const db = require('../mysql');
const { TABLE } = require('../mysql/song');
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

puppeteer.use(StealthPlugin());

const authorNames = ['张国荣', '谢霆锋', '张韶涵'];

const support_formats = {
  MP3: 'mp3',
  M4A: 'm4a'
};

const PAGE_TYPE = {
  HAS_PLAYER: 0,
  NO_PLAYER_WITH_LINK: 1,
  NO_PLAYER_WITHOUT_LINK: 2
}

const DOWNLOAD_PATH = 'C:\\Users\\hssww\\OneDrive\\Documents\\BaiduSyncdisk\\music';

function getFormatFromUrl(url) {
  return Object.values(support_formats).find(format => url.includes(`.${format}?`) || url.endsWith(`.${format}`))
}

function printLog(level, ...args) {
  const seperator = '|-';
  let prefixStr = '';
  if (level > 1) {
    prefixStr = (new Array(level - 2)).fill('  ') + seperator
  }
  console.log(prefixStr, ...args);
}

async function getAuthorByName(name) {
  const sql = `SELECT id from authors WHERE name = "${name}"`;
  const result = await db.query(sql);
  return Promise.resolve(result[0] ? result[0].id : null);
}
async function getOneAuthor(authorName) {
  // get id
  const authorId = await getAuthorByName(authorName);
  if (!authorId) {
    printLog(2, `没有对应歌手:${authorName}`);
    return false;
  }
  const sql = `SELECT * FROM songs WHERE ${TABLE.songs.author_id}="${authorId}"`

  const list = await db.query(sql);
  const downloadList = ((authorName, songList) => {
    const authorDownloadDir = path.join(DOWNLOAD_PATH, authorName)
    // 去文件夹查找上一次停在哪里；已标记跳过的不再处理
    const isFolderExist = fs.existsSync(authorDownloadDir);
    const downloadFiles = isFolderExist
      ? fs.readdirSync(authorDownloadDir).map(p => p.replace(/\.[\w\d+]+$/, ''))
      : [];
    const skippedCount = songList.filter(s => Number(s.type) === PAGE_TYPE.NO_PLAYER_WITHOUT_LINK).length;
    if (skippedCount > 0) {
      printLog(2, `已记录跳过 ${skippedCount} 首，本次不再处理`);
    }
    return songList.filter(s => {
      if (Number(s.type) === PAGE_TYPE.NO_PLAYER_WITHOUT_LINK) return false;
      return !downloadFiles.includes(sanitizeFilename(s.text));
    });
  })(authorName, list);
  const folderPath = path.join(DOWNLOAD_PATH, authorName);
  createFolder(folderPath);

  for (let i = 0; i < downloadList.length; i++) {
    const record = downloadList[i];
    const { id, link, text, music_url } = record;
    printLog(1, `(${i + 1}/${downloadList.length})开始处理:${text}`);
    try {
      if (music_url) {
        await downloadMP3(music_url, folderPath, sanitizeFilename(`${text}.${getFormatFromUrl(music_url)}`))
      } else {
        await downloadByLink(id, link, text, folderPath);
      }
    } catch (err) {
      printLog(2, `处理失败，跳过: ${text} song id=${id}`, err && err.message);
      await markSkipped(id, err && err.message);
    }
  }
}
async function downloadByLink(id, link, text, folderPath) {
  let browser;
  const closeBrowser = async () => {
    if (!browser) return;
    try {
      await browser.close();
    } catch (err) {
      // 浏览器已关闭时忽略
    }
    browser = null;
  };

  try {
    browser = await puppeteer.launch({ headless: false }); // 打开浏览器
    const page = await browser.newPage();

    // 伪装 User-Agent，避免被识别
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    await page.setCookie(...[
      { name: 'bbs_sid', value: '36bpve7s8cgg082eus3fqfrmvj', domain: 'hifiti.com/' },
      { name: 'cookie_test', value: 'kfWUJXMoH1cLhHylPWtqfzAvZGw51p_2BKPh3Padncu_2BwZn_2Fgb', domain: 'hifiti.com/' },
      { name: 'tac_tmp', value: 'TDsFi6F1PxxHiFiNixxePJyBskhxxHiFiNixxF3XYFeTQxhkFNFp8ow0AGR1jvhGAHZbn1vHCPesdP5xxHiFiNixxPT', domain: 'hifiti.com/' }
    ]);

    await page.goto(link, { waitUntil: 'networkidle2' });

    // 延迟 2 秒
    await sleep(3);

    if (await hasPlayer(page)) {
      return await handlePageWithPlayer(page, closeBrowser);
    }
    return await handlePathWithoutPlayer(page, closeBrowser);
  } catch (err) {
    printLog(2, `处理失败，跳过: ${text} song id=${id}`, err && err.message);
    await markSkipped(id, err && err.message);
    await closeBrowser();
    return false;
  }

  async function handlePageWithPlayer(page, close) {
    await page.click('.aplayer-button button');
    printLog(3, '播放按钮已点击，等待 MP3 加载...');

    // 监听网络请求，获取 MP3 资源
    const MAX_LOOP_TIME = 1000 * 20; // 等待20s
    let settled = false;

    return new Promise((resolve) => {
      page.on('response', async (response) => {
        const url = response.url();
        if (settled || !getFormatFromUrl(url) || url.includes('helloworld.mp3')) return;
        settled = true;
        try {
          // 存入MP3地址
          await db.update('songs', { [TABLE.songs.music_url]: `"${url}"` }, { id: `"${id}"` });

          // 下载 MP3
          await downloadMP3(url, folderPath, sanitizeFilename(`${text}.${getFormatFromUrl(url)}`));
          await sleep(2);
          await close();
          resolve(true);
        } catch (err) {
          printLog(2, `处理失败，跳过: ${text} song id=${id}`, err && err.message);
          await markSkipped(id, err && err.message);
          await close();
          resolve(false);
        }
      });

      setTimeout(() => {
        if (settled) return;
        settled = true;
        printLog(3, `超过${MAX_LOOP_TIME / 1000}s 未解析到url,自动关闭`, text, `song id=${id}`);
        markSkipped(id, '超时未解析到url').finally(async () => {
          await close();
          resolve(false);
        });
      }, MAX_LOOP_TIME);
    });
  }

  async function handlePathWithoutPlayer(page, close) {
    const { links, text: pageText } = await getCloudDiskLink(page);
    if (links.length > 0) {
      // 保存links
      printLog(2, `检测到网盘link:${links}`);
      await db.update('songs', { [TABLE.songs.clouddisk_links]: `"${links.join(',')}"`, [TABLE.songs.type]: PAGE_TYPE.NO_PLAYER_WITH_LINK, [TABLE.songs.description]: `"${pageText.join(' ').slice(0, 200)}"` }, { id: `"${id}"` });
      await close();
      return true;
    }
    // 跳过
    await db.update('songs', { [TABLE.songs.type]: PAGE_TYPE.NO_PLAYER_WITHOUT_LINK, [TABLE.songs.description]: `"${pageText.join(' ').slice(0, 200)}"` }, { id: `"${id}"` });
    printLog(2, `跳过 song id=${id}`);
    await close();
    return false;
  }
}

// 判断是否有播放器
async function hasPlayer(page) {
  return await page.evaluate(() => {
    return !!document.querySelector('.aplayer-button button');
  });
}

async function getCloudDiskLink(page) {
  return await page.evaluate(() => {
    function isCloudNetLink(text) {
      const isBaidu = /https:\/\/pan.baidu.com\/.+/.test(text);
      const isQuark = /https:\/\/pan.quark.cn\/.+/.test(text);
      return isBaidu || isQuark;
    }
    const messageEl = document.querySelector('.main .message');
    if (!messageEl || !messageEl.innerText) {
      return { text: [], links: [] };
    }
    const textArr = messageEl.innerText.split('\n').filter(i => !!i);
    return { text: textArr, links: textArr.filter(text => isCloudNetLink(text)) };
  });
}

const PLAY_BUTTON = '.aplayer-button.aplayer-play';

function isMp3Response(response) {
  const url = response.url();
  if (!url || /helloworld\.mp3/i.test(url)) return false;
  const type = String(response.headers()['content-type'] || '').toLowerCase();
  if (type.includes('audio/mpeg') || type.includes('audio/mp3')) return true;
  return /\.mp3(\?|#|$)/i.test(url) || /[?&]format=mp3\b/i.test(url);
}

const DOWNLOAD_TIMEOUT = 30000;

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message || '超时')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function downloadAudioFile(url, folder, filename, redirectLeft = 5) {
  const filePath = path.join(folder, filename);
  return new Promise((resolve) => {
    let settled = false;
    let request = null;
    let writing = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(totalTimer);
      if (!ok) {
        if (request) request.destroy();
        if (writing) fs.unlink(filePath, () => {});
      }
      resolve(ok);
    };
    const totalTimer = setTimeout(() => {
      printLog(3, `下载超过 ${DOWNLOAD_TIMEOUT / 1000}s，跳过`, filename);
      finish(false);
    }, DOWNLOAD_TIMEOUT);
    const lib = url.startsWith('http://') ? http : https;
    request = lib.get(url, (response) => {
      const status = response.statusCode || 0;
      const location = response.headers.location;
      if (status >= 300 && status < 400 && location && redirectLeft > 0) {
        response.resume();
        settled = true;
        clearTimeout(totalTimer);
        resolve(downloadAudioFile(new URL(location, url).href, folder, filename, redirectLeft - 1));
        return;
      }
      const type = String(response.headers['content-type'] || '').toLowerCase();
      if (status >= 400 || type.includes('text/html')) {
        response.resume();
        finish(false);
        return;
      }
      writing = true;
      const file = fs.createWriteStream(filePath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        printLog(3, 'MP3 下载完成:', filename);
        finish(true);
      });
      file.on('error', () => finish(false));
      response.on('error', () => finish(false));
    });
    request.setTimeout(15000, () => {
      printLog(3, '下载连接超时，跳过', filename);
      finish(false);
    });
    request.on('error', (err) => {
      if (settled) return;
      console.error('下载出错:', err.message);
      finish(false);
    });
  });
}

async function pausePlayback(page) {
  for (let i = 0; i < 6; i++) {
    const pauseButton = await page.$('.aplayer-button.aplayer-pause');
    if (pauseButton) {
      await pauseButton.click({ timeout: 3000 }).catch(() => {});
      printLog(3, '已再次点击，暂停播放');
      return;
    }
    await sleep(0.3);
  }
  await page.click('.aplayer-button', { timeout: 3000 }).catch(() => {});
  printLog(3, '已再次点击播放按钮');
}

function waitForMp3AfterPlay(page) {
  const MAX_LOOP_TIME = 1000 * 20;
  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const finish = (response) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      page.off('response', onResponse);
      resolve(response || null);
    };
    const onResponse = (response) => {
      try {
        if (settled || !isMp3Response(response)) return;
      } catch (err) {
        return;
      }
      finish(response);
      pausePlayback(page).catch(() => {});
    };
    page.on('response', onResponse);
    timer = setTimeout(() => {
      printLog(3, `等待 mp3 超过 ${MAX_LOOP_TIME / 1000}s，跳过`);
      finish(null);
    }, MAX_LOOP_TIME);
    page.click(PLAY_BUTTON, { timeout: 8000 })
      .then(() => printLog(3, '已点击 aplayer-play，等待 mp3'))
      .catch((err) => {
        printLog(3, '点击播放按钮失败', err && err.message);
        finish(null);
      });
  });
}

async function saveMp3ToFile(response, folder, filename) {
  const filePath = path.join(folder, filename);
  try {
    const body = await withTimeout(response.buffer(), 12000, '读取浏览器音频超时');
    if (body && body.length > 1024) {
      fs.writeFileSync(filePath, body);
      return true;
    }
  } catch (err) {
    printLog(3, '无法直接保存浏览器响应，改为重新请求', err && err.message);
  }
  return downloadAudioFile(response.url(), folder, filename);
}

async function downloadOpenedPage(page, text, folderPath, hooks = {}) {
  createFolder(folderPath);
  try {
    await page.waitForSelector(PLAY_BUTTON, { timeout: 15000 });
  } catch (err) {
    return { ok: false, message: '没有找到播放按钮 aplayer-play' };
  }
  const response = await waitForMp3AfterPlay(page);
  if (!response) {
    return { ok: false, message: '已点击播放，但 20 秒内没有监听到 mp3' };
  }
  const mp3Url = response.url();
  printLog(2, `监听到 mp3: ${mp3Url}`);
  const filename = sanitizeFilename(`${String(text).slice(0, 80)}.mp3`);
  const filePath = path.join(folderPath, filename);
  if (hooks.onMp3) {
    try {
      hooks.onMp3({ mp3Url, filename, folderPath, filePath });
    } catch (err) {
      printLog(3, '通知播放地址失败', err && err.message);
    }
  }
  const saved = await saveMp3ToFile(response, folderPath, filename);
  const size = saved && fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  if (!saved || size < 1024) {
    return { ok: false, message: '监听到 mp3，但文件没有保存到本地', filename, folderPath, filePath, mp3Url, size };
  }
  return {
    ok: true,
    message: `已下载到 ${filePath}`,
    filename,
    folderPath,
    filePath,
    size,
    mp3Url
  };
}

// 下载 MP3 文件
const downloadMP3 = (url, folder, filename) => {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(path.join(folder, filename));
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        printLog(3, 'MP3 下载完成:', filename);
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => { }); // 删除未完成的文件
      console.error('下载出错:', err.message);
      resolve(false);
    });
  })
};

const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};
function sleep(second) {
  return new Promise(resolve => setTimeout(resolve, 1000 * second));
}

const sanitizeFilename = (name) => {
  return name.replace(/[\/\\:*?"<>|]/g, '-'); // 替换特殊字符
};

async function markSkipped(id, description) {
  const fields = { [TABLE.songs.type]: PAGE_TYPE.NO_PLAYER_WITHOUT_LINK };
  if (description) {
    fields[TABLE.songs.description] = `"${String(description).replace(/"/g, '').slice(0, 200)}"`;
  }
  await db.update('songs', fields, { id: `"${id}"` });
}

function start(names) {
  (names || authorNames).forEach(async author => await getOneAuthor(author));
}

if (require.main === module) {
  start();
}
module.exports = {
  DOWNLOAD_PATH,
  sanitizeFilename,
  downloadOpenedPage
}