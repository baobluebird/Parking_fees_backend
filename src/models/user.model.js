const { poolPromise } = require('../config/connection');
const bcrypt = require('bcrypt');

const createUser = async (data) => {
    try {
        if (!data || typeof data !== 'object' || !data.id || !data.name || !data.password || !data.email || !data.address || !data.phone) {
            throw new Error('Invalid data object or missing properties');
        }

        const pool = await poolPromise;

        // Kiểm tra xem địa chỉ email đã tồn tại trong cơ sở dữ liệu chưa
        const checkDuplicateEmailQuery = `
            SELECT UserId
            FROM Users
            WHERE Email = @Email
        `;
        const checkDuplicateEmailRequest = pool.request();
        checkDuplicateEmailRequest.input('Email', data.email);
        const duplicateEmailResult = await checkDuplicateEmailRequest.query(checkDuplicateEmailQuery);
        if (duplicateEmailResult.recordset.length > 0) {
            return 'Email is already in use';
        }

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


const loginUser = async (data) => {
    try {
        if (!data || typeof data !== 'object' || !data.email || !data.password) {
            throw new Error('Invalid data object or missing properties');
        }
        const pool = await poolPromise;

        const request = pool.request();
        request.input('Email', data.email);

        const result = await request.query(`
            SELECT UserId, Username, Email, Phone, Address, Password, IsAdmin
            FROM Users
            WHERE Email = @Email
        `);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const passwordMatch = await bcrypt.compare(data.password, user.Password);
            if (passwordMatch) {
                return user;
            } else {
                return "Password not match"
            }
        } else {
            return "User not found";
        }
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

const updateUser = async (id, data) => {
    try {
        if (!id || !data || typeof data !== 'object') {
            throw new Error('Invalid data object or missing properties');
        }

        const pool = await poolPromise;
        if (data.email) {
            const checkDuplicateEmailQuery = `
                SELECT UserId
                FROM Users
                WHERE Email = @Email AND UserId != @UserId
            `;
            const checkDuplicateEmailRequest = pool.request();
            checkDuplicateEmailRequest.input('Email', data.email);
            checkDuplicateEmailRequest.input('UserId', id);
            const duplicateEmailResult = await checkDuplicateEmailRequest.query(checkDuplicateEmailQuery);
            if (duplicateEmailResult.recordset.length > 0) {
                return 'Email is already in use by another user'
            }
        }
        // Kiểm tra xem số điện thoại mới có bị trùng lặp không
        if (data.phone) {
            const checkDuplicatePhoneQuery = `
                SELECT UserId
                FROM Users
                WHERE Phone = @Phone AND UserId != @UserId
            `;
            const checkDuplicatePhoneRequest = pool.request();
            checkDuplicatePhoneRequest.input('Phone', data.phone);
            checkDuplicatePhoneRequest.input('UserId', id);
            const duplicatePhoneResult = await checkDuplicatePhoneRequest.query(checkDuplicatePhoneQuery);
            if (duplicatePhoneResult.recordset.length > 0) {
                return 'Phone number is already in use by another user';
            }
        }

        const request = pool.request();
        request.input('UserId', id);
        if (data.name) {
            request.input('Username', data.name); 
        }
        if (data.email) {
            request.input('Email', data.email);
        }
        if (data.address) {
            request.input('Address', data.address);
        }
        if (data.phone) {
            request.input('Phone', data.phone);
        }

        let updateQuery = 'UPDATE Users SET';
        let updateValues = [];

        if (data.name) {
            updateQuery += ' Username = @Username,';
        }
        if (data.email) {
            updateQuery += ' Email = @Email,';
        }
        if (data.address) {
            updateQuery += ' Address = @Address,';
        }
        if (data.phone) {
            updateQuery += ' Phone = @Phone,';
        }

        updateQuery = updateQuery.slice(0, -1);
        updateQuery += ' OUTPUT inserted.UserId, inserted.Username, inserted.Email, inserted.Phone, inserted.Address, inserted.IsAdmin';
        updateQuery += ' WHERE UserId = @UserId';

        const result = await request.query(updateQuery);

        if (result.recordset.length > 0) {
            return result.recordset[0]; // Return updated user information
        } else {
            throw new Error('User not found after update'); // Or handle this case as needed
        }
    } catch (error) {
        console.error('Error updating data:', error);
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
    createUser,
    loginUser,
    updateUser
}