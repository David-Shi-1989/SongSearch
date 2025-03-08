const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_PAGE = 3501;

const targetPage = `https://www.hifini.com/forum-1-${START_PAGE}.htm?orderby=tid`;

let result = [];

(async () => {
  // 启动浏览器
  const browser = await puppeteer.launch({ headless: false }); // headless: false 可以看到浏览器操作
  const page = await browser.newPage();

  // 设置视口大小
  await page.setViewport({ width: 1280, height: 800 });

  // 访问目标页面
  const url = targetPage;
  await page.goto(url, { waitUntil: 'networkidle2' });

  let currentPage = await getCurrentPage(page);
  const totalPage = await getTotalPage(page);
  await walkSpecificPage(page, currentPage, totalPage);

  // 切换到第二页
  while (currentPage < totalPage) {
    const nextPageButton = await page.$('ul.pagination > li:last-child');
    if (nextPageButton) {
      await nextPageButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' }); // 等待页面加载完成

      // 提取第二页的内容
      currentPage = await getCurrentPage(page);
      await walkSpecificPage(page, currentPage, totalPage);
      result = saveCache(result, currentPage, totalPage);
    } else {
      console.log('没有找到下一页按钮');
    }
  }
  // 保存到json文件
  saveCache(result, currentPage, totalPage);
  // 关闭浏览器
  await browser.close();
})();

// 提取指定页面里的内容
async function walkSpecificPage(page, currentPage, totalPage) {
  // 提取第一页的内容
  const posts = await extractPosts(page);
  if (posts.length > 0) {
    console.log(`处理页码：${currentPage}/${totalPage}. 得到${posts.length}条数据`);
    result.push(...posts);
    if (posts.some(i => i.isError)) {
      console.warn('有误数据', posts.filter(i => i.isError).map(i => i.title).join(','));
    }
  } else {
    console.warn('Can not find post in page ', currentPage)
  }
  return Promise.resolve(true);
}

// 提取帖子内容的函数
async function extractPosts(page) {
  return await page.evaluate(() => {
    const posts = [];
    const postElements = document.querySelectorAll('ul.list-unstyled > li:not(.top_3)');
    postElements.forEach(element => {
      const titleLink = element.querySelector('.media-body .subject a')
      if (titleLink) {
        const title = titleLink.text;
        const link = titleLink.href;
        const { author, songName } = ((title) => {
          let author = '', songName = ''
          const authorMatch = title.match(/^.+(?=《)/);
          if (authorMatch) {
            author = title.match(/^.+(?=《)/)[0].trim();
          }
          const songNameMatch = title.match(/(?<=《)(.+)(?=》)/);
          if (songNameMatch) {
            songName = title.match(/(?<=《)(.+)(?=》)/)[0].trim();
          }
          return { author, songName }
        })(title)

        const item = {
          title,
          link,
        };
        if (author && songName) {
          Object.assign(item, { author, songName });
        } else {
          Object.assign(item, { isError: true });
        }
        posts.push(item);
      }
    });

    return posts;
  });
}

// 获取当前页码号
async function getCurrentPage(page) {
  return await page.evaluate(() => {
    const activePagination = document.querySelector('ul.pagination > li.active');
    return parseInt(activePagination.innerText);
  })
}

// 获取总的page数
async function getTotalPage(page) {
  return await page.evaluate(() => {
    const lastPagination = document.querySelector('ul.pagination > li:nth-last-child(2)');
    return parseInt(lastPagination.innerText.replace(/[^\d]/g, ''));
  })
}

function saveCache(result, currentPage, totalPage) {
  let fileName = ''
  // 每隔10页保存到一个json文件里
  if (currentPage % 10 === 0) {
    const startPage = currentPage - 9;
    fileName = `data-[${startPage}-${currentPage}][${result.length}].json`;
    result = []
  } else if (currentPage === totalPage) {
    const startPage = Math.floor(currentPage / 10) * 10 + 1;
    fileName = `data-[${startPage}-${totalPage}][${result.length}].json`;
  }
  if (fileName) {
    console.log(`保存文件:${fileName}`);
    fs.writeFileSync(path.join(__dirname, 'data', fileName), JSON.stringify(result, null, 2));
  }
  return result
}