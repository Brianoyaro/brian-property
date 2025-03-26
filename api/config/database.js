const mysql = require('mysql2');
require('dotenv').config();

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// }).promise();


// Create the connection to local database
const connection = mysql.createPool({
    host: 'localhost',
    user: 'brian',
    password: 'password',
    database: 'property_connect_backend',
  });

// Create the connection to remote database
//const connection = mysql.createPool({
//     port: 3306,
//     host: 'sql.freedb.tech',
//     user: 'freedb_brian-oyaro',
//     password: '?%PNCbpU@BWEjb3',
//     database: 'freedb_brian-oyaro-database',
//   });


module.exports = connection;

