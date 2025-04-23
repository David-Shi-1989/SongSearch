const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes');
const path = require('path')

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

const externalMp3Dir = path.resolve('C:\\Users\\hssww\\OneDrive\\Documents\\BaiduSyncdisk\\music');
app.use('/mp3', express.static(externalMp3Dir));

// 载入 API 路由
app.use('/api', dataRoutes);

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
