const fs = require('fs/promises');
const path = require('path');
const { getParser } = require('./logs');
const { text } = require('./utils');

/**
 * Generates a .build file for the DVT Extension.
 * @param {string} logPath - The path to the log file.
 * @param {string} workingDirectory - The working directory.
 * @param {string} [buildFileName='default'] - The name of the output file.
 * @throws {Error} If the .dvt folder is not found.
 */
async function generateBuildConfigFile(logPath, workingDirectory, buildFileName = 'default') {
    const dvtPath = path.join(workingDirectory, '.dvt');

    try {
        await fs.access(dvtPath);
    } catch (err) {
        throw new Error('Cannot find a .dvt folder in the current location.');
    }

    const logType = path.basename(logPath, path.extname(logPath)); // notes

    const { parse } = getParser(logType);

    const buildFilePath = path.join(dvtPath, `${buildFileName}.build`);
    const startLines = getStartLines({ logPath, workingDirectory });
    const content = await parse(logPath, workingDirectory);
    const endLines = getEndLines();

    const buildFileContent = `${startLines}\n\n${content}\n${endLines}`;

    try {
        await fs.writeFile(buildFilePath, buildFileContent, { encoding: 'utf-8', flag: 'w' });
    } catch (err) {
        throw new Error(`Cannot write to file: ${buildFilePath}.`);
    }
}

/**
 * Returns the first lines of the .build file.
 * @param {Object} config - The configuration object.
 * @param {string} config.logPath - The path to the log file.
 * @param {string} config.workingDirectory - The working directory.
 * @returns {string} The first lines of the .build file.
 */
function getStartLines({ logPath, workingDirectory }) {
    const dvtCompilationRoot = workingDirectory;
    const runLogPath = logPath ? path.normalize(logPath) : '';
    return text(`
        # ------------------------------------------------------------------------------------
        # This file has been automatically generated from the following log file:
        # ${runLogPath}
        # If you encounter any issues, please contact Hadassa Zisman at h_zisman@apple.com.
        # ------------------------------------------------------------------------------------
        +dvt_init+vcs.vlogan -sverilog
        +dvt_init+ius.irun
        +dvt_compilation_root+${dvtCompilationRoot}
        +dvt_semantic_checks_timeout+90
        +incdir+${dvtCompilationRoot}
        # ------------------------------------------------------------------------------------
    `);
}

/**
 * Returns the last lines of the .build file.
 * @returns {string} The last lines of the .build file.
 */
function getEndLines() {
    return text(`
        # End lines
        -top hw_top
        -top tb_top
    `);
}

module.exports = {
    generateBuildConfigFile,
};
