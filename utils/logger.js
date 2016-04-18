// transport logs to an external location
var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    // specify Appenders
    transports: [
        // log into a file with verbosity level set to info, max 5 files and 5 MB for each
        new winston.transports.File({
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        // complete full log (verbosity level debug) in the terminal with different level using different colors.
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};