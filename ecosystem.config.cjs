module.exports = {
    apps: [{
        // Process name (matches your current PM2 process)
        name: 'letslearn',

        // Script to run
        script: './dist/index.js',

        // Working directory (adjust to your actual path)
        cwd: '/root/letslearnlead/server',

        // Single instance
        instances: 1,
        exec_mode: 'fork',

        // Environment variables (always production)
        env: {
            NODE_ENV: 'production',
            PORT: 5000,
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000,
        },

        // Auto-restart configuration
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',

        // Crash protection
        min_uptime: '10s',        // Consider app crashed if uptime < 10s
        max_restarts: 10,         // Max 10 restarts within 1 minute
        restart_delay: 4000,      // Wait 4s before restart

        // Logging
        error_file: '/root/letslearnlead/logs/error.log',
        out_file: '/root/letslearnlead/logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Log rotation
        log_type: 'json',

        // Advanced features
        kill_timeout: 5000,
        listen_timeout: 3000,
        shutdown_with_message: true,

        // Time zone
        time: true,
    }]
};
