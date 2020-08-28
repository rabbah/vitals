const mysql = require('mysql2/promise');
const creds = JSON.parse(process.env.__NIM_SQL);

module.exports.mysql = mysql.createConnection({
    host: creds.host,
    user: creds.user,
    database: creds.database,
    password: creds.password
})
