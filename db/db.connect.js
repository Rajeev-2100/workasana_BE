const mongoose = require('mongoose')
require('dotenv').config()


const initializeDatabase = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI)
        console.log('Database connection successfully')
        return connect
    } catch (error) {
        console.error(error.message)
    }
}

module.exports = initializeDatabase  