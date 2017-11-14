//===== set up logging
const winston = require("winston");
const level = (process.env.PRF_NODE_ENV === 'production') ? 'warn' : process.env.PRF_LOG_LEVEL || 'debug';

const winstonlogger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: level,
            colorize: true,
            timestamp: function () {
                return (new Date()).toISOString();
            }
        })
    ]
});

module.exports = winstonlogger;