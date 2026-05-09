/**
 * src/utils/logger/index.js — Centralised structured logger
 *
 * Provides coloured console output in dev and structured JSON in production.
 * Drop-in replacement for kythia-core's internal logger.
 */

const clc = require('cli-color');

const isProduction = process.env.NODE_ENV === 'production';

const LEVELS = {
    debug:   { colour: clc.cyan,          prefix: '[DEBUG]  ' },
    info:    { colour: clc.white,         prefix: '[INFO]   ' },
    success: { colour: clc.green,         prefix: '[OK]     ' },
    warn:    { colour: clc.yellow,        prefix: '[WARN]   ' },
    error:   { colour: clc.red.bold,      prefix: '[ERROR]  ' },
    section: { colour: clc.magenta.bold,  prefix: '[BOOT]   ' },
};

function timestamp() {
    return new Date().toISOString();
}

function formatMeta(meta) {
    if (!meta || typeof meta !== 'object') return '';
    return ' ' + JSON.stringify(meta);
}

function write(level, message, meta) {
    const cfg = LEVELS[level] || LEVELS.info;

    if (isProduction) {
        // Structured JSON for log aggregators (Railway, Datadog, etc.)
        const entry = {
            ts:      timestamp(),
            level,
            message,
            ...(meta && typeof meta === 'object' ? meta : {}),
        };
        if (level === 'error') {
            process.stderr.write(JSON.stringify(entry) + '\n');
        } else {
            process.stdout.write(JSON.stringify(entry) + '\n');
        }
        return;
    }

    // Coloured dev output
    const ts  = clc.blackBright(timestamp());
    const pfx = cfg.colour(cfg.prefix);
    const msg = cfg.colour(message);
    const ext = meta ? clc.blackBright(formatMeta(meta)) : '';

    console.log(`${ts} ${pfx}${msg}${ext}`);
}

const log = {
    debug:   (msg, meta) => write('debug',   msg, meta),
    info:    (msg, meta) => write('info',    msg, meta),
    success: (msg, meta) => write('success', msg, meta),
    warn:    (msg, meta) => write('warn',    msg, meta),
    error:   (msg, meta) => {
        if (meta instanceof Error) {
            write('error', msg, { message: meta.message, stack: meta.stack });
        } else {
            write('error', msg, meta);
        }
    },
    section: (title) => {
        const bar = '═'.repeat(50);
        write('section', `${bar}\n  ${title}\n  ${bar}`);
    },
};

module.exports = log;
