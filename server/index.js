const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dataRoutes = require('./routes');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 载入 API 路由
app.use('/api', dataRoutes);

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
