const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'dbms',
  password: '2528'

});

module.exports = pool.promise();