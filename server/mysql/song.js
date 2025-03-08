const { v4: uuidv4 } = require('uuid');
const { chunk } = require('lodash');
const db = require('./index');

const TABLE = {
  authors: {
    id: 'id',
    name: 'name',
    songs_number: 'songs_number',
    is_enable: 'is_enable'
  },
  songs: {
    id: 'id',
    title: 'title',
    author_id: 'author_id',
    author_id_2: 'author_id_2',
    author_id_3: 'author_id_3',
    author_id_4: 'author_id_4',
    author_ids: 'author_ids',
    text: 'text',
    type: 'type',
    link: 'link',
    description: 'description',
    music_url: 'music_url',
    clouddisk_links: 'clouddisk_links',
    is_enable: 'is_enable'
  }
}

async function batchInsertAuthor(authorList) {
  const chunkList = chunk(authorList, 1000);
  console.log(`数据库保存author,总数据量${authorList.length},分为${chunkList.length}组.`);
  for (let i = 0; i < chunkList.length; i++) {
    const tmpChunk = chunkList[i];
    console.log(`当前正在处理Author第${i + 1}/${chunkList.length}`);
    const author_keys = [TABLE.authors.id, TABLE.authors.name].join(',');
    const values = [];
    tmpChunk.forEach(item => {
      const tmpId = uuidv4();
      item.id = tmpId;
      item.songList.forEach(s => {
        s.author_id = tmpId;
      });
      values.push({ id: tmpId, name: item.author.replace(/"/g, '') });
    })
    const valuesSql = values.map(({ id, name }) => `("${id}", "${name}")`).join(',');
    const sql = `INSERT INTO authors (${author_keys}) VALUES ${valuesSql}`;

    // save author
    await db.query(sql);
  }
  // save songs
  for (let i = 0; i < chunkList.length; i++) {
    const tmpChunk = chunkList[i];
    const songKeys = [
      TABLE.songs.id,
      TABLE.songs.title,
      TABLE.songs.link,
      TABLE.songs.text,
      TABLE.songs.author_id,
      TABLE.songs.author_id_2,
      TABLE.songs.author_id_3,
      TABLE.songs.author_id_4,
      TABLE.songs.author_ids,
    ].join(',');
    for (let j = 0; j < tmpChunk.length; j++) {
      const songValues = [];
      const currentAuthor = tmpChunk[j];
      const { songList } = currentAuthor;
      songList.forEach(song => {
        const tmpId = uuidv4();
        song.id = tmpId;
        let authodIds = song.author.map(a => {
          const matchedAuthor = authorList.find(({ author }) => author === a);
          return matchedAuthor?.id ?? null;
        });
        if (authodIds.length > 4) {
          authodIds = authodIds.slice(0, 4).concat(authodIds.slice(4).join(','))
        } else {
          authodIds = authodIds.concat(Array(5 - song.author.length).fill(null)).map(i => i ? i : "");
        }

        songValues.push([tmpId, song.songName, song.link, song.title, ...authodIds])
      });
      const songValuesStr = songValues.map(t => `(${t.map(t => {
        const parsed = (t || '').replace(/"/g, '');
        return `"${parsed}"`;
      }).join(',')})`);
      const sql = `INSERT INTO songs (${songKeys}) VALUES ${songValuesStr}`;
      console.log(`当前正在处理Song第${i + 1}/${chunkList.length}.数据量:${songValues.length}`);
      await db.query(sql);
    }
  }
}

async function calculateNumberByAuthorId(authorId) {
  const sql = `SELECT 
    COUNT(*) AS total_songs
FROM songs
WHERE author_id = '${authorId}'
   OR author_id_2 = '${authorId}'
   OR author_id_3 = '${authorId}'
   OR author_id_4 = '${authorId}'
   OR FIND_IN_SET('${authorId}', author_ids) > 0;`;

   const result = await db.query(sql);
   return result[0].total_songs;
}

module.exports = {
  batchInsertAuthor,
  TABLE,
  calculateNumberByAuthorId
};
