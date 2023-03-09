/**
 * Generates .build file for the DVT Extension
 */

const fs = require('fs/promises');
const path = require('path');


/**
 * Extract the configuration from the line
 * @param {String} line 
 * @param {String} chiplet
 * @param {String} workingDirectory
 * @returns { String }
 */
function parseLine(line, chiplet, workingDirectory) {

    line = line.replace(`released/${chiplet}_cfg/soft_ip/${chiplet}/tb/`, `${chiplet}/tb/`);

    const match = line.match(/^([+]incdir[+])?(\/[\w/.]+)$/);
    if (match) {
        let [_, prefix, location] = match;
        location = path.relative(workingDirectory, location);
        line = (prefix ?? '' ) + location;
    }

    if (line.startsWith('-y ') || line.startsWith('-v ')) {
        return '';
    }

    if (line.startsWith('-f ')) {
        return `\n# Content from ${line.slice(3)}`;
    }

    return line;
}

/**
 * Finds the first occurrence of the regex in the text
 * @param {RegExp} regex 
 * @param {String} text 
 * @returns { [String, Number] }
 */
function findMatch(regex, text) {
    const match = text.match(regex);

    if (!match) {
        throw new Error(`Could not find the pattern ${regex}" in "${text}"`);
    }

    return [ match[0], match.index + match[0].length ];
}

/**
 * Extracts all the wanted env variables, he xrun command content and the uvm lib location
 * @param {String} logPath 
 * @param  {...String} envVars 
 * @returns { Promise<[String, Object, String]> } the xrun command content, the env variables and the uvm location
 */
async function parseLogFile(logPath, ...envVars) {

    let logContent = await fs.readFile(logPath, { encoding: 'ascii'});

    // Extract env variables
    const env = {};
    const setEnvSectionRegex = /(setenv \w+\s+'\S+'\n)+/;
    const [setEnvSection, setEnvEndIndex] = findMatch(setEnvSectionRegex, logContent);
    for (const varName of envVars) {
        let match = setEnvSection.match(new RegExp(`setenv ${varName}\\s+'(\\w+)'\n`));
        if (!match) throw new Error(`Could not find envrionment variable: ${varName}`);
        env[varName] = match[1];
    }
    
    // Extract xrun command
    logContent = logContent.slice(setEnvEndIndex);
    const xrunCommandRegex = /(?<=xrun\n)[^]+?(?=REBUILD)/;
    const [xrunCommand, xrunCommandEndIndex] = findMatch(xrunCommandRegex, logContent);
    if (!xrunCommand) {
        throw new Error('Could not find xrun command in the log file');
    }

    // Extract uvm location
    logContent = logContent.slice(xrunCommandEndIndex);
    const uvmLocationRegex = /Compiling UVM packages.*using uvmhome location (\S+)/;
    const [uvmLocation, ..._] = findMatch(uvmLocationRegex, logContent);

    return [xrunCommand, env, uvmLocation];
}

/**
 * Formats text
 * @param {String} unformattedText 
 * @returns {String} 
 */
function text(unformattedText) {
    return unformattedText.split('\n').map(line => line.trim()).join('\n');
}

/**
 * Returns the first lines of the .build file
 * @param {Object} config 
 * @returns {String}
 */
function getStartLines(config) {

    const uvmLocation = config.uvmLocation ?? '/org/seg/tools/eda/cadence/xcelium/22.03.v006/tools/methodology/UVM/CDNS-1.2/';
    const dvtCompilationRoot = config.workingDirectory;

    const runLogPath = config.runLogPath
                       ? path.normalize(config.runLogPath)
                       : '';

    return text(`
        #
        # This file has been automatically generated from the following log file:
        # ${runLogPath}.
        # If you encounter any issues, please contact Hadassa Zisman at h_zisman@apple.com.
        #

        +dvt_init+vcs.vlogan -sverilog
        +dvt_init+ius.irun
        +dvt_compilation_root+${dvtCompilationRoot}
        +dvt_semantic_checks_timeout+90
        +incdir+${dvtCompilationRoot}
        
        # uvm
        f+incdir+${uvmLocation}/sv/src
        f${uvmLocation}/sv/src/uvm_pkg.sv

    `);
}

/**
 * Return the last lines of the .build file
 * @returns {String}
 */
function getEndLines() {
    return text(`
        # End lines
        -top hw_top
        -top tb_top
    `);
}

async function genrateBuildConfigFile(runLogPath, workingDirectory, buildFileName='default') {
    const dvtPath = `${workingDirectory}/.dvt/`;

    try {
        await fs.access(dvtPath);
    } catch {
        throw new Error('Can not find a .dvt folder in current location');
    }

    const chipletNameVar = 'CHIPLET_NAME';
    const [ xrunCommand, envVariables, uvmLocation ] = await parseLogFile(runLogPath, chipletNameVar);

    const buildFilePath = `${dvtPath}${buildFileName}.build`;
    const startLines = getStartLines({ uvmLocation, runLogPath, workingDirectory });
    
    let buildFileContent = startLines + "\n\n";
    
    for (const line of xrunCommand.split('\n')) {
        const result = parseLine(line.trim(), envVariables[chipletNameVar], workingDirectory);
        if (result) {
            buildFileContent += result + '\n';
        }
    }
    
    const endLines = getEndLines();
    buildFileContent += "\n" + endLines;

    await fs.writeFile(buildFilePath, buildFileContent, { encoding: 'utf-8', flag: 'w' });
}


module.exports = { genrateBuildConfigFile };