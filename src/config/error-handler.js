const { INTERNAL_SERVER_ERROR } = require('http-status-codes').StatusCodes

const errorHandler = (req, res, next) => {
    res.onError = onError(req, res)
    next()
}

const onError = (req, res) => (error) => {
    let statusCode = INTERNAL_SERVER_ERROR
    let errorMessage = 'Unespected error'
    
    res.status(statusCode).send({ error: errorMessage })
    console.error('[Error]: ' + (error.stack || JSON.stringify(error)))
}

module.exports = {
    errorHandler
}