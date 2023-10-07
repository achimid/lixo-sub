const healthcheck = require('./healthcheck')
const subtitle = require('../subtitle/controller')

const { errorHandler } = require('./error-handler')

const prefix = "/api/v1"

module.exports = (app) => {
    console.info(`Registrando rotas...`)

    app.use(errorHandler)

    app.use(`${prefix}`, healthcheck)
    app.use(`${prefix}/subtitle`, subtitle)

    console.info(`Rotas registradas com sucesso...`)

    return app
}