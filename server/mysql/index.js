const mysql = require('mysql2')

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'root',
  password: 'lymanshi',
  database: 'song',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(DB_CONFIG);

// 封装数据库操作
const db = {
  query: (sql, params) => {
    return new Promise((resolve, reject) => {
      pool.query(sql, params, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results);
        }
      });
    });
  },

  // 插入数据
  insert: (table, data) => {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
    return db.query(sql, values);
  },

  // 查询数据
  select: (table, where = {}, fields = '*') => {
    let sql = `SELECT ${fields} FROM ${table}`;
    const keys = Object.keys(where);
    const values = Object.values(where);

    if (keys.length) {
      const conditions = keys.map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    return db.query(sql, values);
  },

  // 更新数据
  update: (table, data, where) => {
    const setClause = Object.keys(data).map(key => `${key} = ${data[key]}`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ${where[key]}`).join(' AND ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    return db.query(sql, [...Object.values(data), ...Object.values(where)]);
  },

  // 删除数据
  delete: (table, where) => {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    return db.query(sql, Object.values(where));
  },
  getCount: async (tableName, filterEnable = true, wherecase = '') => {
    let sql = `SELECT COUNT(*) FROM ${tableName}`;
    const whereCondition = [filterEnable ? 'is_enable > 0' : '', wherecase].filter(i => i);
    if (whereCondition.length > 0) {
      sql = sql + ` WHERE ${whereCondition.join(' AND ')}`
    }
    const result = await db.query(sql)
    return result[0]['COUNT(*)']
  }
};

module.exports = db;
