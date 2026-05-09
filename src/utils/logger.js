/**
 * src/utils/logger.js — Coloured, structured console logger
 *
 * Provides colour-coded output with timestamps and level labels.
 * All output goes to stdout/stderr so Railway picks it up correctly.
 * In production the timestamp prefix helps log aggregators parse entries.
 *
 * Usage:
 *   import log from './utils/logger.js';
 *   log.info('Server started', { port: 5000 });
 *   log.success('MongoDB connected');
 *   log.warn('SESSION_SECRET is weak');
 *   log.error('Fatal crash', err);
 *   log.debug('Request payload', req.body); // only prints in development
 */

// ANSI colour codes — gracefully ignored by terminals that don't support them
const C = {
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    // Foreground colours
    red:     '\x1b[31m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    blue:    '\x1b[34m',
    magenta: '\x1b[35m',
    cyan:    '\x1b[36m',
    white:   '\x1b[37m',
    gray:    '\x1b[90m',
};

const isProd = process.env.NODE_ENV === 'production';

function timestamp() {
    return new Date().toISOString();
}

function format(level, colour, icon, message, meta) {
    const ts    = `${C.gray}${timestamp()}${C.reset}`;
    const badge = `${C.bold}${colour}${icon} [${level}]${C.reset}`;
    const msg   = `${colour}${message}${C.reset}`;
    const extra = meta !== undefined
        ? `\n${C.dim}${JSON.stringify(meta, null, 2)}${C.reset}`
        : '';
    return `${ts} ${badge} ${msg}${extra}`;
}

const log = {
    /** Informational — general lifecycle events */
    info(message, meta) {
        console.log(format('INFO ', C.blue, 'ℹ', message, meta));
    },

    /** Success — operation completed correctly */
    success(message, meta) {
        console.log(format('OK   ', C.green, '✔', message, meta));
    },

    /** Warning — non-fatal issue that should be reviewed */
    warn(message, meta) {
        console.warn(format('WARN ', C.yellow, '⚠', message, meta));
    },

    /** Error — something failed; includes stack trace in development */
    error(message, errOrMeta) {
        const isErr = errOrMeta instanceof Error;
        const meta  = isErr
            ? { message: errOrMeta.message, stack: isProd ? undefined : errOrMeta.stack }
            : errOrMeta;
        console.error(format('ERROR', C.red, '✖', message, meta));
    },

    /** Debug — verbose detail, only printed in development */
    debug(message, meta) {
        if (!isProd) {
            console.log(format('DEBUG', C.magenta, '⚙', message, meta));
        }
    },

    /** Start-up banner — call once at process start */
    banner(name, version, env) {
        const line = '═'.repeat(52);
        console.log(`\n${C.bold}${C.cyan}╔${line}╗`);
        console.log(`║${' '.repeat(15)}${name} v${version}${' '.repeat(52 - 15 - name.length - version.length - 1)}║`);
        console.log(`║${' '.repeat(15)}Environment : ${env.padEnd(52 - 15 - 14)}║`);
        console.log(`╚${line}╝${C.reset}\n`);
    },

    /** Section divider — visually separates startup phases */
    section(title) {
        const pad = Math.max(0, 50 - title.length);
        const lp  = Math.floor(pad / 2);
        const rp  = pad - lp;
        console.log(`\n${C.bold}${C.cyan}┌${'─'.repeat(52)}┐`);
        console.log(`│${' '.repeat(lp)} ${title} ${' '.repeat(rp)}│`);
        console.log(`└${'─'.repeat(52)}┘${C.reset}`);
    },
};

export default log;
