const fs = require('fs/promises');
const path = require('path');
const { getParser } = require('./logs');
const { text } = require('./utils');

/**
 * Generates a DVT build configuration file from a log file.
 * @param {Object} options - The options for generating the build configuration file.
 * @param {string} options.logPath - The path to the log file.
 * @param {string} options.workingDirectory - The working directory.
 * @param {string[]} [options.tops=[]] - The tops to include in the build configuration file.
 * @param {number} [options.semanticChecksTimeout=300] - The semantic checks timeout in seconds.
 * @param {string} [options.buildFileName=dvt_build] - The name of the build configuration file.
 * @param {Object[]} [options.pathTransformations=[]] - The path transformations.
 * @returns {Promise<void>}
 */
async function generateBuildConfigFile({
    logPath,
    workingDirectory,
    tops=[],
    semanticChecksTimeout=300,
    buildFileName='default',
    pathTransformations = [],
}) {
    const dvtPath = path.posix.join(workingDirectory, '.dvt');

    try {
        await fs.access(dvtPath);
    } catch (err) {
        throw new Error('Cannot find a .dvt folder in the current location.');
    }

    const logType = path.basename(logPath, path.extname(logPath));

    const { parse } = getParser(logType);

    const buildFilePath = path.posix.join(dvtPath, `${buildFileName}.build`);
    const startLines = getStartLines({ logPath, workingDirectory, semanticChecksTimeout });
    const content = await parse(logPath, pathTransformations);
    const endLines = getEndLines(tops);

    const buildFileContent = `${startLines}\n\n${content}\n${endLines}`;

    try {
        await fs.writeFile(buildFilePath, buildFileContent, { encoding: 'utf-8', flag: 'w' });
    } catch (err) {
        throw new Error(`Cannot write to file: ${buildFilePath}.`);
    }
}

/**
 * Returns the start lines for the DVT build configuration file.
 * @param {Object} options - The options for generating the start lines.
 * @param {string} options.logPath - The path to the log file.
 * @param {string} options.workingDirectory - The working directory.
 * @param {number} options.semanticChecksTimeout - The semantic checks timeout in seconds.
 * @returns {string}
 */
function getStartLines({ logPath, workingDirectory, semanticChecksTimeout }) {
    const dvtCompilationRoot = workingDirectory;
    const runLogPath = logPath ? path.normalize(logPath) : '';
    return text(`
        # ------------------------------------------------------------------------------------
        # This file has been automatically generated from the following log file:
        # ${runLogPath}
        # If you encounter any issues, please contact Hadassa Zisman at h_zisman@apple.com.
        # ------------------------------------------------------------------------------------
        # Generated at: ${new Date().toLocaleString()}
        # ------------------------------------------------------------------------------------
        +dvt_init+vcs.vlogan -sverilog
        +dvt_init+ius.irun
        +dvt_compilation_root+${dvtCompilationRoot}
        +dvt_semantic_checks_timeout+${semanticChecksTimeout}
        +incdir+${dvtCompilationRoot}
        # ------------------------------------------------------------------------------------
    `);
}

/**
 * Returns the last lines for the DVT build configuration file.
 * @param {string[]} tops - The tops to include in the build configuration file.
 * @returns {string}
 */
function getEndLines(tops) {
    return text(`
        # End lines
        ${tops.map(top => `-top ${top}`).join('\n')}
    `);
}

module.exports = {
    generateBuildConfigFile,
};
