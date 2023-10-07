
require('dotenv').config()

const { databaseInit } = require('./config/database')
const express = require('express')
const app = express()
const routes = require('./config/routes')

app.use(express.json())

databaseInit().then(() => routes(app))

app.listen(process.env.PORT || 3000)