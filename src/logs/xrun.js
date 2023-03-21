const fs = require('fs/promises');
const globCuptureRegex = require('glob-capture-regex');
const { text, transformPath, isValidDvtBuildConfigLine } = require('../utils');

/**
 * Parses a line of the xrun command and applies any necessary transformations.
 * @param {string} line - A line from the xrun command.
 * @param {string} workingDirectory - The current working directory
 * @param {Array<{ from: string, to: string }>} pathTransformations - An array of transformation objects.
 * @returns {string} - The parsed line.
 */
function parseLine(line, workingDirectory, pathTransformations) {

    // If the line contains a file location, normalize it.
    const match = line.match(/^([+]incdir[+])?(\/[\w/.]+)$/);
    if (match) {
        let [_, prefix, location] = match;
        line = (prefix ?? '') + transformPath(location, workingDirectory, pathTransformations);
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
 * @returns {Promise<[string, string]>} - The xrun command and the uvm location.
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

    const uvmLocationRegex = /using uvmhome location (\S+)/;
    const uvmLocation = logContent.match(uvmLocationRegex);


    return [xrunCommand[0], uvmLocation?.[1]];
}

/**
 * Parses the xrun command from the given log file and generates the build file content.
 * @param {string} runLogPath - The path to the log file.
 * @param {string} workingDirectory - The current working directory
 * @param {Object} buildFileConfig - Configuration options for the build file
 * @returns {Promise<string>} - The content of the build file.
 */
async function parse(runLogPath, workingDirectory, buildFileConfig) {
    const [xrunCommand, uvmLocation] = await extractXrunCommand(runLogPath);

    let buildFileContent = uvmLocation ? text(`
        # uvm
        +incdir+${uvmLocation}/sv/src
        ${uvmLocation}/sv/src/uvm_pkg.sv
        
    `) : '';

    const { deleteSkippedDirectives, skipDirectives, pathTransformations } = buildFileConfig;
    // Parse each line of the xrun command and append it to the buildFileContent string.
    for (const line of xrunCommand.split('\n')) {
        const result = parseLine(line.trim(), workingDirectory, pathTransformations);
        
        if (result) {
            if (!deleteSkippedDirectives || !skipDirectives.some(d => globCuptureRegex(d + '**').regex.test(result))) {
                buildFileContent += result + '\n';
            }
        }
    }

    return buildFileContent;
}

module.exports = { parse };
