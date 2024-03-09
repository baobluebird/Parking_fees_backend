const UserRouter = require('./user.routes')
const CodeRouter = require('./code.routes')

const routes = (app) => {
    app.use('/api/user', UserRouter)
    app.use('/api/code', CodeRouter)
}

module.exports = routes