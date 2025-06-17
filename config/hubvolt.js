const db = require('mysql2');
const hubvolt = db.createPool({
    host : process.env.host,
    user : process.env.user,
    password : process.env.password,
    database : process.env.database
});
module.exports = hubvolt;