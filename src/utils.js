const path = require('path');

/**
 * Returns a function that takes a path and normalizes it relative to the working directory.
 * @param {string} workingDirectory - The absolute path of the working directory.
 * @returns {Function} - A function that takes a path and returns a normalized path.
 */
function getNormalizePathFn(workingDirectory) {

    const currentPathArray = workingDirectory.split('/');
    const chiplet = currentPathArray[currentPathArray.length - 2];

    /**
     * Normalizes the given path relative to the working directory.
     * @param {string} pathText - The path to be normalized.
     * @returns {string} - The normalized path.
     */
    return function(pathText) {
        let normalized = pathText.replace(`released/${chiplet}_cfg/soft_ip/${chiplet}/tb/`, `${chiplet}/tb/`);
        normalized = path.relative(workingDirectory, normalized);
        return normalized;
    }
}

/**
 * Formats the given text by trimming each line and joining them with newline characters.
 * @param {string} unformattedText - The text to be formatted.
 * @returns {string} - The formatted text.
 */
function text(unformattedText) {
    return unformattedText.split('\n').map(line => line.trim()).join('\n');
}

/**
 * Returns the filename without the all the path and the extension from the given file path.
 * @param {string} filePath - The file path.
 * @returns {string} - The filename without all the path and the extension.
 */
function getFileName(filePath) {
    return filePath.split('/').pop().replace(/[.]\S+$/, '');
}

module.exports = {
    getNormalizePathFn,
    text,
    getFileName,
}
