const supportedLogs = [
    'xrun',
]

/**
 * Gets the parser module for the given log type.
 * @param {string} logType - The type of log file to parse.
 * @returns {object} Returns the parser module for the given log type.
 * @throws {Error} Throws an error if the log type is not supported.
 */
function getParser(logType) {
    if (!supportedLogs.includes(logType)) {
        throw new Error('Unsupported log file type');
    }

    return require(`./${logType}`);
}

module.exports = {
    getParser,
}