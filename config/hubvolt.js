const db = require('mysql2');
const hubvolt = db.createPool({
    host : "localhost",
    user : "root",
    password : "6103",
    database : "hubvolt",
});
module.exports = hubvolt;