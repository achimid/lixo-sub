const router = require('express').Router()


router.get('/', async (req, res) => { 
    res.json({status: 'ok'}) 
})

module.exports = router