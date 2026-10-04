const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../mysql');
const { withNewTab } = require('./browser-session');
const { downloadOpenedPage, DOWNLOAD_PATH, sanitizeFilename } = require('./download');

function extractSearchPage() {
  function textOf(el) {
    return el ? el.innerText.replace(/\s+/g, ' ').trim() : '';
  }
  function toAbsolute(href) {
    if (!href) return '';
    if (/^https?:/i.test(href)) return href;
    return 'https://hifiti.com/' + href.replace(/^\.\//, '').replace(/^\//, '');
  }

  const summary = textOf(document.querySelector('.alert.alert-info'));
  const totalMatch = summary.match(/找到\s*(\d+)\s*条/);
  const list = [];
  document.querySelectorAll('li.media.thread').forEach((el) => {
    const titleLink = el.querySelector('.subject a');
    const title = textOf(titleLink);
    if (!title) return;
    const href = titleLink.getAttribute('href') || el.getAttribute('data-href') || '';
    list.push({
      title,
      link: toAbsolute(href),
      author: textOf(el.querySelector('.media-body .username')),
      date: textOf(el.querySelector('.media-body .date')),
      views: textOf(el.querySelector('.badge-posts')),
      pans: Array.from(el.querySelectorAll('.pan-name')).map((node) => textOf(node)).filter(Boolean)
    });
  });

  const pageLinks = Array.from(document.querySelectorAll('ul.pagination a.page-link'));
  let pageCount = 1;
  let currentPage = 1;
  pageLinks.forEach((anchor) => {
    const label = anchor.textContent.trim();
    if (!/^\d+$/.test(label)) return;
    const num = Number(label);
    if (num > pageCount) pageCount = num;
    const item = anchor.closest('.page-item');
    if (item && item.classList.contains('active')) currentPage = num;
  });
  const hasNext = pageLinks.some((anchor) => anchor.textContent.trim() === '▶');
  const total = totalMatch ? Number(totalMatch[1]) : list.length;
  if (hasNext && list.length && total > list.length) {
    pageCount = Math.max(pageCount, Math.ceil(total / list.length));
  }
  let notice = '';
  if (!list.length) {
    const blocks = Array.from(document.querySelectorAll('.card .card-body'));
    const hit = blocks.map(textOf).find((text) => /暂无该资源|不支持搜索|暂不支持/.test(text));
    notice = hit || '';
  }
  return {
    summary,
    notice,
    total,
    page: currentPage,
    pageCount,
    list
  };
}

function searchPageUrl(keyword, page) {
  if (page <= 1) return `https://hifiti.com/search.htm?keyword=${encodeURIComponent(keyword)}`;
  return `https://hifiti.com/search-${encodeURIComponent(keyword)}-1-1-${page}.htm`;
}

async function searchHifiti(keyword, page = 1) {
  const pageNumber = Math.max(1, Number(page) || 1);
  return withNewTab(searchPageUrl(keyword, pageNumber), async (browserPage) => {
    await browserPage.waitForSelector('li.media.thread, .alert.alert-info', { timeout: 20000 }).catch(() => {});
    const pageData = await browserPage.evaluate(extractSearchPage);
    return {
      keyword,
      summary: pageData.summary,
      notice: pageData.notice,
      total: pageData.total,
      page: pageData.page || pageNumber,
      pageCount: pageData.pageCount || 1,
      list: pageData.list
    };
  });
}

async function saveDownloadedSong({ link, title, mp3Url, authorName }) {
  const songTitle = (String(title).match(/《([^》]+)》/) || [])[1] || title;
  const text = String(title || '').slice(0, 120);
  const shortTitle = String(songTitle).slice(0, 120);
  const existing = await db.query('SELECT id FROM songs WHERE link = ? LIMIT 1', [link]);
  if (existing.length) {
    await db.query('UPDATE songs SET music_url = ?, text = ?, title = ?, type = 0 WHERE id = ?', [mp3Url, text, shortTitle, existing[0].id]);
    return existing[0].id;
  }
  let authorId = null;
  if (authorName) {
    const authors = await db.query('SELECT id FROM authors WHERE name = ? LIMIT 1', [authorName]);
    authorId = authors[0] ? authors[0].id : null;
  }
  const id = uuidv4();
  await db.query(
    'INSERT INTO songs (id, title, author_id, text, type, link, music_url) VALUES (?, ?, ?, ?, 0, ?, ?)',
    [id, shortTitle, authorId, text, link, mp3Url]
  );
  return id;
}

async function downloadHifitiThread({ link, title, onMp3 }) {
  const artistMatch = String(title || '').match(/^(.+?)《/);
  const authorName = (artistMatch && artistMatch[1].trim()) || '';
  const folderName = sanitizeFilename(authorName || 'hifiti') || 'hifiti';
  const folderPath = path.join(DOWNLOAD_PATH, folderName);
  const result = await withNewTab(link, (page) => downloadOpenedPage(page, title || link, folderPath, { onMp3 }), { closePage: false });
  if (!result.ok) return Object.assign({ link, title, folderPath }, result);
  const songId = await saveDownloadedSong({ link, title, mp3Url: result.mp3Url, authorName });
  return Object.assign({ link, title, folderPath, songId }, result);
}

module.exports = {
  searchHifiti,
  extractSearchPage,
  downloadHifitiThread
};
