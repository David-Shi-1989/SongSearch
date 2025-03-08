const { omit } = require("lodash");
const db = require("../mysql");

const PAGE_SIZE = 50;

exports.author = {
  list: async (page = 1, size) => {
    const sql = `SELECT * FROM authors WHERE is_enable > 0 ORDER BY songs_number DESC LIMIT ${size || PAGE_SIZE} OFFSET ${page - 1}`
    const result = await db.query(sql)
    return result.map(i => omit(i, 'is_enable'))
  }
}
