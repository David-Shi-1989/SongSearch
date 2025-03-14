const express = require('express');
const router = express.Router();
const { author, user } = require('../controllers/dataController');
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

// User
router.get('/user/list', async (req, res) => {
  const list = await user.list()
  res.json(baseResponse(list));
});

module.exports = router;
