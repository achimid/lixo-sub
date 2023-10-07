const Subtitle = require('./model')

const create = (subtitle) => {   
    return new Subtitle(subtitle).save()
}

module.exports = {
    create
}