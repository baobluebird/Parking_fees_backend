//F:\app_thu_phi\be\src\models\user.model.js
const User = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const createUser = async (user) => {
    try {
        user.id = crypto.randomBytes(16).toString('hex')
        user.password = bcrypt.hashSync(user.password, 10)
        const response = await User.createUser(user)
        if (!response) {
            return {
                status: 'ERR',
                message: 'Create user failed'
            }
        }
        else {
            return {
                user: response,
                status: 'OK',
                message: 'Create user successfully'
            }
        }
    } catch (e) {
        return e
    }
}

module.exports = {
    createUser
}