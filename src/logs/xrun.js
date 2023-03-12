const fs = require('fs/promises');
const { getNormalizePathFn } = require('../utils');

/**
 * Parses a single line of xrun command and returns a modified version of it based on certain conditions.
 *
 * @param {string} line - A single line of the xrun command.
 * @param {string} workingDirectory - The working directory for the build process.
 * @returns {string} - The modified line.
 */
function parseLine(line, workingDirectory) {
    const normalize = getNormalizePathFn(workingDirectory);

    // If the line contains a file location, normalize it.
    const match = line.match(/^([+]incdir[+])?(\/[\w/.]+)$/);
    if (match) {
        let [_, prefix, location] = match;
        line = (prefix ?? '') + normalize(location);
    }

    // Remove lines that start with -y or -v.
    if (line.startsWith('-y ') || line.startsWith('-v ')) {
        return '';
    }

    // If the line starts with -f, add a comment to indicate the file's content.
    if (line.startsWith('-f ')) {
        return `\n# Content from ${line.slice(3)}`;
    }

    return line;
}

/**
 * Extracts the xrun command from the log file.
 *
 * @param {string} logPath - The path to the xrun.log file.
 * @returns {Promise<string>} - A Promise that resolves with the xrun command as a string.
 * @throws Will throw an error if the xrun command cannot be found in the log file.
 */
async function extractXrunCommand(logPath) {
    let logContent = await fs.readFile(logPath, { encoding: 'utf-8' });

    // Extract xrun command from the log file.
    const xrunCommandRegex = /(?<=xrun\n)[^]+?(?=REBUILD)/;
    const xrunCommand = logContent.match(xrunCommandRegex);
    if (!xrunCommand) {
        throw new Error('Could not find xrun command in the log file');
    }

    return xrunCommand[0];
}

/**
 * Parses the xrun command from the log file and returns a the build file content.
 *
 * @param {string} runLogPath - The path to the xrun.log file.
 * @param {string} workingDirectory - The working directory for the build process.
 * @returns {Promise<string>} - A Promise that resolves with the build file content as a string.
 */
async function parse(runLogPath, workingDirectory) {
    const xrunCommand = await extractXrunCommand(runLogPath);

    let buildFileContent = '';

    // Parse each line of the xrun command and append it to the buildFileContent string.
    for (const line of xrunCommand.split('\n')) {
        const result = parseLine(line.trim(), workingDirectory);
        if (result) {
            buildFileContent += result + '\n';
        }
    }

    return buildFileContent;
}

module.exports = { parse };