const db = require('../mysql');
const { TABLE } = require('../mysql/song');
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const https = require('https');
const path = require('path');

puppeteer.use(StealthPlugin());

const authorNames = ['林俊杰'];

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
    // 去文件夹查找上一次停在哪里
    const isFolderExist = fs.existsSync(authorDownloadDir);
    if (isFolderExist) {
      const downloadFiles = fs.readdirSync(authorDownloadDir).map(p => p.replace(/\.[\w\d+]+$/, ''));
      return songList.filter(s => !downloadFiles.includes(sanitizeFilename(s.text)));
    } else {
      return songList;
    }
  })(authorName, list);
  const folderPath = path.join(DOWNLOAD_PATH, authorName);
  createFolder(folderPath);

  for (let i = 0; i < downloadList.length; i++) {
    const record = downloadList[i];
    const { id, link, text, music_url } = record;
    printLog(1, `(${i + 1}/${downloadList.length})开始处理:${text}`);
    if (music_url) {
      await downloadMP3(music_url, folderPath, sanitizeFilename(`${text}.${getFormatFromUrl(music_url)}`))
    } else {
      await downloadByLink(id, link, text, folderPath);
    }
  }
}
async function downloadByLink(id, link, text, folderPath) {
  return new Promise(async (resolve) => {
    const browser = await puppeteer.launch({ headless: false }); // 打开浏览器
    const page = await browser.newPage();

    // 伪装 User-Agent，避免被识别
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    await page.setCookie(...[
      { name: 'bbs_sid', value: '36bpve7s8cgg082eus3fqfrmvj', domain: 'www.hifini.com' },
      { name: 'cookie_test', value: 'kfWUJXMoH1cLhHylPWtqfzAvZGw51p_2BKPh3Padncu_2BwZn_2Fgb', domain: 'www.hifini.com' },
      { name: 'tac_tmp', value: 'TDsFi6F1PxxHiFiNixxePJyBskhxxHiFiNixxF3XYFeTQxhkFNFp8ow0AGR1jvhGAHZbn1vHCPesdP5xxHiFiNixxPT', domain: 'www.hifini.com' }
    ]);

    await page.goto(link, { waitUntil: 'networkidle2' });

    // 延迟 2 秒
    await sleep(3);

    async function handlePageWithPlayer() {
      await page.click('.aplayer-button button');
      printLog(3, '播放按钮已点击，等待 MP3 加载...');

      // 监听网络请求，获取 MP3 资源
      let mp3Url = '';
      const MAX_LOOP_TIME = 1000 * 20; // 等待20s
      let responseReceived = false;
      page.on('response', async (response) => {
        const url = response.url();
        if (getFormatFromUrl(url) && !url.includes('helloworld.mp3')) {
          mp3Url = url;
          responseReceived = true;
          // 存入MP3地址
          await db.update('songs', { [TABLE.songs.music_url]: `"${mp3Url}"` }, { id: `"${id}"` });

          // 下载 MP3
          await downloadMP3(mp3Url, folderPath, sanitizeFilename(`${text}.${getFormatFromUrl(url)}`));
          await sleep(2);

          // 关闭浏览器
          await browser.close();
          resolve(true);
        }
      });

      setTimeout(async () => {
        if (!responseReceived) {
          printLog(3, `超过${MAX_LOOP_TIME / 1000}s 未解析到url,自动关闭`, text);
          await browser.close();
          resolve(false);
        }
      }, MAX_LOOP_TIME);
    }
    async function handlePathWithoutPlayer() {
      const { links, text } = await getCloudDiskLink(page);
      if (links.length > 0) {
        // 保存links
        printLog(2, `检测到网盘link:${links}`);
        await db.update('songs', { [TABLE.songs.clouddisk_links]: `"${links.join(',')}"`, [TABLE.songs.type]: PAGE_TYPE.NO_PLAYER_WITH_LINK, [TABLE.songs.description]: `"${text.join(' ').slice(0, 200)}"` }, { id: `"${id}"` });
        resolve(true)
      } else {
        // 跳过
        await db.update('songs', { [TABLE.songs.type]: PAGE_TYPE.NO_PLAYER_WITHOUT_LINK, [TABLE.songs.description]: `"${text.join(' ').slice(0, 200)}"` }, { id: `"${id}"` });
        printLog(2, `跳过`);
        resolve(false)
      }
      // 关闭浏览器
      await browser.close();
    }

    if ((await hasPlayer(page))) {
      // 找到播放按钮并点击
      handlePageWithPlayer();
    } else {
      // 如果没有播放器,则跳过
      handlePathWithoutPlayer();
    }
  })
}
(() => {
  authorNames.forEach(async author => await getOneAuthor(author));
})();

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
    const textArr = document.querySelector('.main .message').innerText.split('\n').filter(i => !!i);
    return { text: textArr, links: textArr.filter(text => isCloudNetLink(text)) };
  });
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
