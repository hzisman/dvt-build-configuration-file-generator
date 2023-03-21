const fs = require('fs/promises');
const path = require('path');
const { getParser } = require('./logs');
const { text } = require('./utils');

/**
 * Generates a DVT build configuration file from a log file.
 * @param {Object} options - The options for generating the build configuration file.
 * @param {string} options.logPath - The path to the log file.
 * @param {string} options.workingDirectory - The working directory.
 * @param {string} [options.buildFileName=dvt_build] - The name of the build configuration file.
 * @param {Object} options.buildFileConfig - Configuration options for the build file
 * @returns {Promise<void>}
 */
async function generateBuildConfigFile({
    logPath,
    workingDirectory,
    buildFileName='default',
    buildFileConfig,
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
    const startLines = getStartLines({ logPath, workingDirectory, buildFileConfig });
    const content = await parse(logPath, workingDirectory, buildFileConfig);
    const endLines = getEndLines(buildFileConfig.tops);

    const buildFileContent = `${startLines}${content}\n${endLines}`;

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
 * @param {Object} options.buildFileConfig - Configuration options for the build file
 * @returns {string}
 */
function getStartLines({ logPath, workingDirectory, buildFileConfig }) {
    const dvtCompilationRoot = workingDirectory;
    const runLogPath = logPath ? path.normalize(logPath) : '';

    const { semanticChecksTimeout, skipDirectives, skipCompiles, deleteSkippedDirectives } = buildFileConfig;
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

        # Run time improvments
        ${skipDirectives.map(d => `+dvt_skip_directive+"${d}"`).join('\n')} ${deleteSkippedDirectives ? '# These files were deleted' : ''}
        ${skipCompiles.map(c => `+dvt_skip_compile+"${c}"`).join('\n')}
        # Map verilog files to systemVerilog
        +dvt_ext_map+SystemVerilog_2009+.v+.vh
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
