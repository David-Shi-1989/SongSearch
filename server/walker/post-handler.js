const fs = require('fs');
const { isString, isArray, sortBy, reverse } = require('lodash');
const path = require('path')
const { batchInsertAuthor, batchInsertSong } = require('../mysql/song');

const authorList = [];
const itemWithoutAuthor = [];

// 遍历每隔json文件,找到isError的item

const DATA_PATH = path.join(__dirname, 'data');

function loopAllJsonFile() {
  const files = fs.readdirSync(DATA_PATH);
  files.forEach(file => {
    const isJsonFile = /\.json$/.test(file);
    if (isJsonFile) {
      const data = getJsonFileObj(path.join(DATA_PATH, file));
      const errorList = data.filter(i => i.isError);
      if (errorList.length > 0) {
        errorList.forEach(errorItem => {
          errorItem = parseErrorItem(errorItem);
        });
      }
      parseAuthor(data);
      statisticAuthor(data);

      // save json file
      fs.writeFileSync(path.join(DATA_PATH, file), JSON.stringify(data, null, 2));
    }
  })
}
function getJsonFileObj(jsonFilePath) {
  const content = fs.readFileSync(jsonFilePath, "utf8");
  try {
    return JSON.parse(content)
  } catch (err) {
    debugger
  }
}
function parseErrorItem(item) {
  
  const handlerList = [
    // 陈润秋「第一个清晨 (Live)」[FLAC/MP3-320K]
    (item) => {
      const { title } = item;
      const authorMatch = title.match(/^.+(?=「)/);
      const songNameMatch = title.match(/(?<=「)(.+)(?=」)/);
      if (authorMatch) {
        item.author = authorMatch[0];
      }
      if (songNameMatch) {
        item.songName = songNameMatch[0];
      }
      if (item.author || item.songName) {
        delete item.isError;
      }
      return item;
    },
    // 过滤出带 求和找的
    (item) => {
      if (['求', '找', '帮'].some(keyword => item.title.includes(keyword))) {
        console.log(item.title);
      }
      return item;
    },
    // 玄觞 - 惊蛰月 （cover 梁颜汐） 无损 flac
    (item) => {
      const { title, isError } = item;
      if (isError) {
        const arr = title.replace(/\s+/g,'-').split('-').map(i => i.trim()).filter(i => i);
      }
      return item;
    }
  ];
  handlerList.forEach(handler => {
    item = handler(item);
  });
  return item;
}
function parseAuthor(list) {
  list.forEach(item => {
    const {author} = item;
    if (isString(item.author)) {
      const parsedAuthor = author.replace(/&/g, '/');
      if (parsedAuthor.includes('/')) {
        const authors = parsedAuthor.split('/').map(i => i.trim()).filter(i => !!i && ['.'].includes(i));
        item.author = authors;
      } else {
        item.author = [item.author];
      }
    } else if (isArray(item.author)) {
      item.author = item.author.filter(i => !['.', '..', '...', '....'].includes(i));
    }
  })
}
function statisticAuthor(list) {
  function addAuthor(item) {
    const { author } = item;
    if (author) {
      author.forEach(oneAuthor => {
        const matchAuthor = authorList.filter(i => i.author === oneAuthor);
        if (matchAuthor.length > 0) {
          matchAuthor.forEach(a => a.songList.push(item));
        } else {
          authorList.push({ author: oneAuthor, songList: [item]})
        }
      })
    } else {
      itemWithoutAuthor.push(item);
    }
  }
  list.forEach(item => {
    addAuthor(item);
  })
}
(async () => {
  loopAllJsonFile();
  const authorListAfterSort = reverse(sortBy(authorList, i => i.songList.length));
  await batchInsertAuthor(authorListAfterSort);
  // save songs
  await batchInsertSong(authorListAfterSort);
})();
