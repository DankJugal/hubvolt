const db = require('mysql2');
const hubvolt = db.createPool({
    host : "localhost",
    user : "root",
    password : "",
    database : "hubvolt",
});
module.exports = hubvolt;