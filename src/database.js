const mysql = require('mysql');
const {database} = require('./keys');
const pool = mysql.createPool(database);
const {promisify} = require ('util');
pool.getConnection ((err, connection) => {
    if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST'){
                console.error('DEATH DATABASE CONNECTION ');
                } 
                if (err.code === 'ER_CON_COUNT_ERROR'){
                    console.error('TO MANY DB CONECCTIONS ');
                } 
                if (err.code === 'ENCONNREFUSED'){
                   console.error('HAVE DB CONNECTION REJECTED  ');
                }   
             }
    if(connection) connection.release();



         
});
pool.query= promisify(pool.query);
module.exports = pool;
