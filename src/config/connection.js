const sql = require('mssql')

const dbSettings = {
    user : 'sa',
    password : '1234#',
    server : 'localhost',
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