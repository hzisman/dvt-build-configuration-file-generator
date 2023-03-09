const glob = require('glob-promise');

async function getBuildLogs(workingDirectory) {
    const files = await glob(`${workingDirectory}/../build/_COMPILED_TESTBENCHES_/*/xlm/tb/run.log`);

    return files.map(runLogFile => ({
        [runLogFile.replace(/xlm\/tb\/run.log$/, '')]: runLogFile
    }));
}

module.exports = {
    getBuildLogs,
};