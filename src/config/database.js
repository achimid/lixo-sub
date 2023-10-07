const mongoose = require('mongoose')


const connect = (uri) => {
    console.info(`Iniciando banco de dados...`)

    mongoose.connect(uri)

    return mongoose.connection
}


const databaseInit = async () => {
    const conn = connect(process.env.MONGO_DB_CONNECTION)
    
    conn.on("error", () => {
        console.error(`Erro ao conectar no banco de dados...`)
    })

    conn.once("open", () => {
        console.info(`Banco de dados conectado com sucesso...`)
    })
}

module.exports = {
    databaseInit
}
