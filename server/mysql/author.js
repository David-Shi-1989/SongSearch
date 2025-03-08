const db = require('./index');

async function getAuthorList(pageSize, page) {
  const listSql = `SELECT * FROM authors WHERE is_enable > 0 ORDER BY id LIMIT ${pageSize} OFFSET ${page - 1}`;
  const result = await db.query(listSql);
  return result
}

async function getAuthorWithNoNumList(pageSize, page) {
  const listSql = `SELECT * FROM authors WHERE is_enable > 0 AND songs_number is NULL ORDER BY id LIMIT ${pageSize} OFFSET ${page - 1}`;
  const result = await db.query(listSql);
  return result
}

async function getAuthorTotal() {
  return db.getCount('authors')
}

async function getAuthorWithNoNumTotal() {
  return db.getCount('authors', true, `songs_number is NULL`)
}

module.exports = {
  getAuthorList,
  getAuthorTotal,
  getAuthorWithNoNumTotal,
  getAuthorWithNoNumList
}