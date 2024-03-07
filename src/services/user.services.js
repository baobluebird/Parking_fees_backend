//F:\app_thu_phi\be\src\models\user.model.js
const User = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const {generalAccessToken, generalAccessTokenForEmail} = require("./JwtService");
const jwt = require('jsonwebtoken');

const createUser = async (user) => {
    return new Promise(async (resolve, reject) => {
    try {
        user.id = crypto.randomBytes(16).toString('hex')
        user.password = bcrypt.hashSync(user.password, 10)
        const response = await User.createUser(user)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Create user failed'
            })
        }
        else if (response === 'Email is already in use by another user') {
            reject ({
                status: 'ERR',
                message: 'Email is already in use by another user'
            })
        }
        else {
            resolve({
                user: response,
                status: 'OK',
                message: 'Create user successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const loginUser = async (user) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await User.loginUser(user)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Login failed'
            })
        }
        else if (response === 'Password not match') {
            reject ({
                status: 'ERR',
                message: 'Password not match'
            })
        }
        else if (response === 'User not found') {
            reject ({
                status: 'ERR',
                message: 'User not found'
            })
        }
        else {
            const access_token = await generalAccessToken({
                id: response?.UserId,
                isAdmin: response?.IsAdmin
            })
            resolve({
                id: response?.UserId,
                access_token,
                status: 'OK',
                message: 'Login successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

const getId = async (token) => {
    return new Promise(async (resolve, reject) => {
    try {
        jwt.verify(token, process.env.ACCESS_TOKEN, function(err, user){
            if(err){
                reject ({
                    status: 'ERR',
                    message: 'Unauthorized'
                })
            }
            const  {payload} = user
            resolve({
                id: payload?.id,
                status: 'OK',
                message: 'Get id successfully'
            })
        });
    } catch (error) {
        reject(error);
      }
    });
  }

const updateUser = async (userId, data) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await User.updateUser(userId, data)
        
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Update user failed'
            })
        }
        else if (response === 'Email is already in use by another user') {
            reject ({
                status: 'ERR',
                message: 'Email is already in use by another user'
            })
        }
        else if (response === 'Phone number is already in use by another user') {
            reject ({
                status: 'ERR',
                message: 'Phone number is already in use by another user'
            })
        }
        else {
            resolve({
                user: response,
                status: 'OK',
                message: 'Update user successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  };

module.exports = {
    createUser,
    loginUser,
    getId,
    updateUser
}