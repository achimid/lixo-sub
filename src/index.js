require('dotenv').config()

const maxAge = process.env.NODE_ENV == 'production' ? 1 * 86400000 : 0

const cors = require('cors')
const express = require('express')
const compression = require('compression')

const app = express()
const routes = require('./config/routes')

const { databaseInit } = require('./config/database')

app.use(cors())

app.use(compression())
app.use(express.json())
app.disable('x-powered-by')

app.use(express.static('public', { maxAge, extensions: ['html', 'xml'] }))

databaseInit().then(() => routes(app))

app.listen(process.env.PORT || 3000)
