/**
 * ecosystem.config.js — PM2 configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
    apps: [
        {
            name:        'kythia-bot',
            script:      'src/index.js',
            interpreter: 'node',
            instances:   1,         // Bot must be single-instance (sharding handled internally)
            exec_mode:   'fork',
            watch:       false,
            max_memory_restart: '1G',

            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },

            // Logging
            out_file:    './logs/out.log',
            error_file:  './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs:  true,

            // Restart policy
            restart_delay:  5000,
            max_restarts:   10,
            min_uptime:     '30s',

            // Graceful shutdown
            kill_timeout:   10000,
            wait_ready:     true,
            listen_timeout: 15000,
        },
    ],
};
