const UserRouter = require('./user.routes')

const routes = (app) => {
    app.use('/api/user', UserRouter)
}

module.exports = routes