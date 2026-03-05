const { Sequelize } = require('sequelize');

const db = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

const configureDB = async () => {
    try {
        await db.authenticate();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { db, configureDB };