const { omit } = require("lodash");
const db = require("../mysql");
const { DOWNLOAD_PATH, sanitizeFilename } = require('../walker/download')
const fs = require('fs');
const path = require("path");

const PAGE_SIZE = 50;

exports.author = {
  list: async (page = 1, size) => {
    const pageSize = size || PAGE_SIZE
    const sql = `SELECT * FROM authors WHERE is_enable > 0 ORDER BY songs_number DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
    const result = await db.query(sql)
    return result.map(i => omit(i, 'is_enable'))
  },
  info: async (id) => {
    const infoSql = `SELECT * FROM authors WHERE is_enable > 0 AND id = "${id}"`
    const result = await db.query(infoSql)
    return result.map(i => omit(i, 'is_enable'))[0]
  },
  songs: async function (id, page, size, keyword = '') {
    const { name } = await this.info(id);
    const sql = `
    SELECT * FROM songs WHERE
      (author_id = "${id}" OR
      author_id_2 = "${id}" OR
      author_id_3 = "${id}" OR
      author_id_4 = "${id}" OR
      author_ids LIKE "%${id}%") AND
      ${keyword ? `
        (text LIKE "%${keyword}%") AND
      ` : ''}
      is_enable > 0 ORDER BY title LIMIT ${size} OFFSET ${(page - 1) * size}`;
    const result = await db.query(sql)
    const authorDownloadDir = path.join(DOWNLOAD_PATH, name);
    const files = fs.existsSync(authorDownloadDir) ? fs.readdirSync(authorDownloadDir) : [];
    return result.map(i => {
      const matchedMusicFile = files.find(f => f.includes(sanitizeFilename(i.text)));
      return Object.assign(omit(i, 'is_enable'), { isExist: !!matchedMusicFile })
    })
  }
}

exports.user = {
  list: async (page = 1, size) => {
    const mockData = [{ name: 'lyman-shi', id: '001' }, { name: 'mengWang', id: '002' }]
    return Promise.resolve(mockData)
  }
}
