const { poolPromise } = require('../config/connection');

const createUser = async (data) => {
    try {
        if (!data || typeof data !== 'object' || !data.id || !data.name || !data.password || !data.email || !data.address || !data.phone) {
            throw new Error('Invalid data object or missing properties');
        }

        const pool = await poolPromise;

        const request = pool.request();
        request.input('UserId', data.id);
        request.input('Username', data.name);
        request.input('Password', data.password);
        request.input('Email', data.email);
        request.input('Address', data.address);
        request.input('Phone', data.phone);

        const result = await request.query(`
            INSERT INTO Users (UserId,Username, Email, Phone, Address, Password)
            OUTPUT inserted.UserId, inserted.Username, inserted.Email, inserted.Phone, inserted.Address, inserted.IsAdmin
            VALUES (@UserId, @Username, @Email, @Phone, @Address, @Password)
        `);

        if (result.recordset.length > 0) {
            return result.recordset[0]; // Return the first row (user information)
        } else {
            throw new Error('User creation failed'); // Or handle this case as needed
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    }
}



// exports.read = async () => {
//     const pool = await poolPromise;
//     const rs = await pool
//         .request()
//         .query(`SELECT *
//                 FROM Users`)

//     return rs.recordset;
// }

// exports.update = async (id, date) => { 
//     const pool = await poolPromise;
//     const rs = await pool
//         .request()
//         .query(`UPDATE Users SET
//                 name = '${date[0].name}'                    
//                 WHERE id = ${id}`);

//     return rs.rowsAffected;
// }

// exports.delete = async (id) => {
//     const pool = await poolPromise;
//     const rs = await pool
//         .request()
//         .query(`DELETE FROM Users
//                 WHERE id = ${id}`)

//     return rs.rowsAffected;
// }

// exports.readById = async(id) =>{
//     const pool = await poolPromise;
//     const rs = await pool
//             .request()
//             .query(`SELECT *
//                     FROM Users 
//                     WHERE id = ${id} `);
    
//             return rs.recordset;
// }

module.exports = {
    createUser
}