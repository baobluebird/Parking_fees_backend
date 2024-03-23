const sql = require('mssql')
const dotenv = require('dotenv');
dotenv.config();
const dbSettings = {
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    server : process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database : 'Parking_Fees',
    options : { 
        encrypt : false,  
        trustServerCertificate : true
    }
}

const poolPromise = new sql.ConnectionPool(dbSettings)
  .connect()
  .then(pool => {
    console.log('Connected to SQLServer...');
    return pool;
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = { 
  sql, poolPromise
};