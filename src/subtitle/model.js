const mongoose = require('mongoose')

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    names: {
        type: [{ type: String }],
        default: undefined
    },
    synonyms: {
        type: [{ type: String }],
        default: undefined
    },
    type: {
        type: String,
        required: false,
    },
    season: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    source: {
        mal: { type: Object },
        jikan: { type: Object },
        atc: { type: Object }
    },
    extra: {
        type: [{ type: Object }],
        default: undefined
    }
}, { timestamps: true })

module.exports = mongoose.model('anime', schema)