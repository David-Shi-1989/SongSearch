const express = require('express');
const router = express.Router();
const { author } = require('../controllers/dataController');

// 定义 API 路由
router.get('/author/list', async (req, res) => {
  const list = await author.list()
  res.json({ success: true, data: list })
});

module.exports = router;
