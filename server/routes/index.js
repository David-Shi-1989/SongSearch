const express = require('express');
const router = express.Router();
const { author, user } = require('../controllers/dataController');
const { searchHifiti, downloadHifitiThread } = require('../walker/hifiti-search');
const { baseResponse } = require('../utils');

// Author
router.get('/author/list', async (req, res) => {
  const list = await author.list()
  res.json(baseResponse(list));
});
router.get('/author/:id', async (req, res) => {
  const id = req.params?.id
  const authorInfo = await author.info(id)
  res.json(baseResponse(authorInfo));
});
router.get('/author/:id/songs', async (req, res) => {
  const id = req.params?.id
  const { page, size, keyword } = req.query
  const songs = await author.songs(id, page, size, keyword)
  res.json(baseResponse(songs));
});

router.get('/hifiti/search', async (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!keyword) {
    res.json({ success: false, message: '请输入关键字' });
    return;
  }
  try {
    const result = await searchHifiti(keyword, page);
    res.json(baseResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || '搜索失败' });
  }
});

function writePlayEvent(res, payload) {
  res.write(`${JSON.stringify(payload)}\n`);
}

router.post('/hifiti/play', async (req, res) => {
  const link = String((req.body && req.body.link) || '').trim();
  const title = String((req.body && req.body.title) || '').trim();
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  if (!link) {
    writePlayEvent(res, { type: 'error', message: '缺少歌曲链接' });
    res.end();
    return;
  }
  res.flushHeaders();
  try {
    const result = await downloadHifitiThread({
      link,
      title,
      onMp3: (info) => writePlayEvent(res, Object.assign({ type: 'ready' }, info))
    });
    writePlayEvent(res, Object.assign({ type: 'done' }, result));
  } catch (err) {
    writePlayEvent(res, { type: 'error', message: err.message || '播放失败' });
  }
  res.end();
});

router.post('/hifiti/download', async (req, res) => {
  const link = String((req.body && req.body.link) || '').trim();
  const title = String((req.body && req.body.title) || '').trim();
  if (!link) {
    res.json({ success: false, message: '缺少歌曲链接' });
    return;
  }
  try {
    const result = await downloadHifitiThread({ link, title });
    res.json(baseResponse(result));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || '下载失败' });
  }
});

// User
router.get('/user/list', async (req, res) => {
  const list = await user.list()
  res.json(baseResponse(list));
});

module.exports = router;
