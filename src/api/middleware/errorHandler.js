/**
 * src/api/middleware/errorHandler.js — Centralised Express error handler
 *
 * TASK REQUIREMENT #4: Create centralized error handler middleware.
 *
 * This is exported for explicit, visible registration in index.js.
 * It MUST be registered AFTER all routes (Express identifies error handlers
 * by 4-parameter arity: err, req, res, next).
 *
 * Usage in index.js:
 *   import { errorHandler } from './api/middleware/errorHandler.js';
 *   // ... all routes registered first ...
 *   app.use(errorHandler);
 */

import log from '../../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Maps known error types to HTTP status codes.
 * Keeps error handling logic out of individual route handlers.
 */
function resolveStatus(err) {
    if (err.status)                                return err.status;
    if (err.statusCode)                            return err.statusCode;
    if (err.name === 'ValidationError')            return 422;
    if (err.name === 'CastError')                  return 400;
    if (err.name === 'MongoServerError' && err.code === 11000) return 409; // duplicate key
    if (err.message?.includes('not allowed by CORS')) return 403;
    if (err.message?.includes('Unauthorized'))     return 401;
    return 500;
}

/**
 * Produces a safe client-facing error message.
 * Never exposes internal details in production.
 */
function resolveMessage(err, status) {
    if (isProduction) {
        // Only expose messages for client errors (4xx)
        if (status >= 400 && status < 500) return err.message;
        return 'Internal server error';
    }
    return err.message || 'Unknown error';
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    const status  = resolveStatus(err);
    const message = resolveMessage(err, status);

    // Always log the full error on the server
    if (status >= 500) {
        log.error(`${req.method} ${req.path} → ${status}`, err);
    } else {
        log.warn(`${req.method} ${req.path} → ${status}: ${err.message}`);
    }

    if (res.headersSent) {
        // Can't send a response — let Express default handler clean up
        return next(err);
    }

    const body = { error: message };

    // In development, include extra debugging fields
    if (!isProduction) {
        body.type  = err.name;
        body.stack = err.stack;
    }

    // Mongoose validation errors — include field details for 422
    if (err.name === 'ValidationError' && err.errors) {
        body.fields = Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v.message])
        );
    }

    return res.status(status).json(body);
}

/**
 * 404 handler — register BEFORE errorHandler, AFTER all routes.
 * Catches any request that didn't match a route.
 */
export function notFoundHandler(req, res) {
    log.debug(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}
