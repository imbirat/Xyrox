/**
 * src/api/middleware/errorHandler.js — Centralised Express error handler
 *
 * Register AFTER all routes. Express identifies error handlers by 4-parameter arity.
 * Never exposes stack traces in production.
 */

'use strict';

const log          = require('@utils/logger');
const isProduction = process.env.NODE_ENV === 'production';

function resolveStatus(err) {
    if (err.status)                                            return err.status;
    if (err.statusCode)                                        return err.statusCode;
    if (err.name === 'ValidationError')                        return 422;
    if (err.name === 'CastError')                              return 400;
    if (err.name === 'MongoServerError' && err.code === 11000) return 409;
    if (err.message?.includes('not allowed by CORS'))          return 403;
    if (err.message?.includes('Unauthorized'))                 return 401;
    return 500;
}

function resolveMessage(err, status) {
    if (isProduction) {
        return status >= 400 && status < 500 ? err.message : 'Internal server error';
    }
    return err.message || 'Unknown error';
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status  = resolveStatus(err);
    const message = resolveMessage(err, status);

    if (status >= 500) {
        log.error(`${req.method} ${req.path} → ${status}`, err);
    } else {
        log.warn(`${req.method} ${req.path} → ${status}: ${err.message}`);
    }

    if (res.headersSent) return next(err);

    const body = { error: message };

    if (!isProduction) {
        body.type  = err.name;
        body.stack = err.stack;
    }

    if (err.name === 'ValidationError' && err.errors) {
        body.fields = Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v.message]),
        );
    }

    return res.status(status).json(body);
}

function notFoundHandler(req, res) {
    log.debug(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFoundHandler };
