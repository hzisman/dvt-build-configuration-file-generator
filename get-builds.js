const glob = require('glob-promise');

async function getBuildLogs(workingDirectory) {
    const files = await glob(`${workingDirectory}/../build/*/_COMPILED_TESTBENCHES_/*/xlm/tb/run.log`);
    
    return files.reduce((logs, curLog) => {
        const buildNameRegexp = /.*\/build\/(\S+)\/_COMPILED_TESTBENCHES_\/\S+\/xlm\/tb\/run.log/
        logs[curLog.replace(buildNameRegexp, '$1')] = curLog;
        return logs;
    }, {});
}

module.exports = {
    getBuildLogs,
};