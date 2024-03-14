const Code = require('../models/code.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const {generalAccessToken, generalAccessTokenForEmail} = require("./JwtService");
const jwt = require('jsonwebtoken');
const EmailService = require('./EmailService');

const createCode = async (email) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await Code.createCode(email)
        console.log(response)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Create code failed'
            })
        }
        else {
            await EmailService.sendEmailForgotPass(email, response.code)
            resolve({
                code: response.code,
                id: response.id,
                status: 'OK',
                message: 'Create code successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  }

  const checkCode = async (id, code) => {
    return new Promise(async (resolve, reject) => {
    try {
        const response = await Code.checkCode(id, code)
        if (!response) {
            reject ({
                status: 'ERR',
                message: 'Check code failed'
            })
        }
        else {
            resolve({
                status: 'OK',
                message: 'Check code successfully'
            })
        }
    } catch (error) {
        reject(error);
      }
    });
  }

  const createTokenEmail = async (email) => {
    return new Promise(async (resolve, reject) => {
    try {
        const access_token = await generalAccessTokenForEmail({
            email
        })
        resolve({
            access_token,
            status: 'OK',
            message: 'Create token email successfully'
        })
    } catch (error) {
        reject(error);
      }
    });
  }

  module.exports = {
    createCode,
    checkCode
  }