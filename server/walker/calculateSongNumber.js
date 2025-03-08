const { isNumber } = require('lodash');
const db = require('../mysql');
const { getAuthorTotal, getAuthorList, getAuthorWithNoNumTotal, getAuthorWithNoNumList } = require('../mysql/author');
const { calculateNumberByAuthorId, TABLE } = require('../mysql/song');

async function main(goThoughAll = false) {
  const authorListTotal = goThoughAll ? await getAuthorTotal() : await getAuthorWithNoNumTotal();
  const PAGE_SIZE = 20;
  let page = 1;
  const PAGE_NUM = Math.ceil(authorListTotal / PAGE_SIZE)
  while(page <= PAGE_NUM) {
    console.log(`开始处理：${page}/${PAGE_NUM}`);
    const list = goThoughAll ? await getAuthorList() : await getAuthorWithNoNumList(PAGE_SIZE, page);
    const sqlList = [];
    for (let i = 0; i < list.length; i++) {
      const currentAuthor = list[i];
      const { id: authorId, name } = currentAuthor
      const songNum = await calculateNumberByAuthorId(authorId);
      console.assert(isNumber(songNum) && songNum > 0, `${name}(${authorId}) has no songs.`)
      sqlList.push({ id: authorId, count: songNum })
    }
    const sql = `
    INSERT INTO authors (id, songs_number) VALUES
    ${sqlList.map(({ id, count}) => `('${id}', ${count})`).join(',')}
    ON DUPLICATE KEY UPDATE songs_number = VALUES(songs_number);
    `
    await db.query(sql);
    page++;
  }
}

async function test(authorId) {
  const songNum = await calculateNumberByAuthorId(authorId);
  console.log(authorId, songNum);
}

main();
// test('005d0b69-8702-4a90-8398-a795acb89a67')
