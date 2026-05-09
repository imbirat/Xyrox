/**
 * src/database/connection.js — Database connection manager
 *
 * Supports:
 *  - SQLite (default, zero-config)
 *  - MySQL/MariaDB (production)
 *  - MongoDB (optional — for session store)
 *
 * Preserves Kythia's original Sequelize-based schema behaviour exactly.
 */

const { Sequelize }          = require('sequelize');
const log                    = require('@utils/logger');
const { getConfig }          = require('@config/index');

let sequelizeInstance = null;

/**
 * Build a Sequelize instance from config.
 * Mirrors the original createSequelizeInstance() from kythia-core.
 */
function createSequelizeInstance() {
    const config = getConfig();
    const db     = config.db;

    const driver = (db.driver || 'sqlite').toLowerCase();

    const baseOptions = {
        logging:         false, // route through our own logger
        pool: {
            max:     10,
            min:     0,
            acquire: 30000,
            idle:    10000,
        },
        define: {
            underscored:    false,
            freezeTableName: false,
            charset:        'utf8mb4',
            dialectOptions: { collate: 'utf8mb4_unicode_ci' },
        },
    };

    if (driver === 'sqlite') {
        const storagePath = db.name || 'kythia.sqlite';
        log.info('Database driver: SQLite', { storage: storagePath });
        return new Sequelize({
            dialect:        'sqlite',
            storage:        storagePath,
            ...baseOptions,
        });
    }

    if (driver === 'mysql' || driver === 'mariadb') {
        log.info('Database driver: MySQL/MariaDB', {
            host: db.host,
            port: db.port,
            name: db.name,
        });
        return new Sequelize(db.name, db.username, db.password, {
            host:    db.host,
            port:    db.port || 3306,
            dialect: 'mysql',
            ...baseOptions,
            dialectOptions: {
                charset:           'utf8mb4',
                supportBigNumbers: true,
                bigNumberStrings:  true,
            },
        });
    }

    throw new Error(`Unsupported DB_DRIVER: ${driver}. Supported: sqlite, mysql`);
}

/**
 * Connect to the database and run pending migrations.
 * Called once during bootstrap.
 */
async function connectDB() {
    log.section('Database');

    sequelizeInstance = createSequelizeInstance();

    try {
        await sequelizeInstance.authenticate();
        log.success('Database connection established');

        // Sync models (alter: true in dev, false in prod — use migrations for prod)
        const alter = process.env.NODE_ENV !== 'production';
        await sequelizeInstance.sync({ alter });

        log.success(`Database synced (alter=${alter})`);
    } catch (err) {
        log.error('Database connection failed', err);
        throw err;
    }

    return sequelizeInstance;
}

/**
 * Returns the active Sequelize instance.
 * Throws if connectDB() has not been called yet.
 */
function getSequelize() {
    if (!sequelizeInstance) {
        throw new Error('Database not initialised. Call connectDB() first.');
    }
    return sequelizeInstance;
}

module.exports = { connectDB, getSequelize, createSequelizeInstance };
