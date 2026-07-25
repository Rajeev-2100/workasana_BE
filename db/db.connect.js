const mongoose = require('mongoose')
require('dotenv').config()

const MONGO_URI = process.env.MONGO_URL


const initializeDatabase = async () => {
    try {
        const connect = await mongoose.connect(MONGO_URI)
        console.log('Database connection successfully')
        return connect
    } catch (error) {
        console.error(error.message)
    }
}

module.exports = initializeDatabase  