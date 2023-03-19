const fs = require('fs/promises');
const { transformPath, isValidDvtBuildConfigLine } = require('../utils');

/**
 * Parses a line of the xrun command and applies any necessary transformations.
 * @param {string} line - A line from the xrun command.
 * @param {Array<{ from: string, to: string }>} pathTransformations - An array of transformation objects.
 * @returns {string} - The parsed line.
 */
function parseLine(line, pathTransformations) {

    // If the line contains a file location, normalize it.
    const match = line.match(/^([+]incdir[+])?(\/[\w/.]+)$/);
    if (match) {
        let [_, prefix, location] = match;
        line = (prefix ?? '') + transformPath(location, pathTransformations);
    }

    // If the line starts with -f, add a comment to indicate the file's content.
    if (line.startsWith('-f ')) {
        return `\n# Content from ${line.slice(3)}`;
    }

    if (!isValidDvtBuildConfigLine(line)) {
        return '';
    }

    return line;
}

/**
 * Extracts the xrun command from the given log file.
 * @param {string} logPath - The path to the log file.
 * @returns {Promise<string>} - The xrun command.
 * @throws Will throw an error if the xrun command could not be found in the log file.
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
 * Parses the xrun command from the given log file and generates the build file content.
 * @param {string} runLogPath - The path to the log file.
 * @param {Array<{ from: string, to: string }>} pathTransformations - An array of transformation objects.
 * @returns {Promise<string>} - The content of the build file.
 */
async function parse(runLogPath, pathTransformations) {
    const xrunCommand = await extractXrunCommand(runLogPath);

    let buildFileContent = '';

    // Parse each line of the xrun command and append it to the buildFileContent string.
    for (const line of xrunCommand.split('\n')) {
        const result = parseLine(line.trim(), pathTransformations);
        if (result) {
            buildFileContent += result + '\n';
        }
    }

    return buildFileContent;
}

module.exports = { parse };
