const router = require('express').Router()
const { OK } = require('http-status-codes').StatusCodes

const service = require('./service')

router.post('/translate', async (req, res) => {
    return service.translate(req.body.content)
        .then(json => res.status(OK).json(json))
        .catch(res.onError)
})


module.exports = router