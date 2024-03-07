import sql from 'mssql'

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

export const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings)

        const result = await pool.request().query("SELECT * FROM Users")
        console.log(result)

        return pool
    }
    catch (error) {
        console.log(error)
    }
}