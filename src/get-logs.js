const glob = require('glob-promise');
const { globWithGroupsToGlob, globWithGroupsToRegexp } = require('./glob/glob-with-groups');

/**
 * Get logs from search locations in the working directory.
 * @param {string} workingDirectory - The path to the working directory.
 * @param {string[]} searchLocations - The locations where logs are searched.
 * @returns {Promise<{ displayName: string, path: string }[]>} - A promise that resolves to an array of objects containing the display name and path of logs.
 */
async function getLogs(workingDirectory, searchLocations) {
    const logs = [];

    for (const location of searchLocations) {
        const globPattern = (
            location.startsWith('/') || location.startsWith('~') 
            ? ''
            : workingDirectory + '/'
        ) + globWithGroupsToGlob(location);
       
        const logFiles = await glob(globPattern);

        // Remove leading dots from location to match with file names
        const regexp = globWithGroupsToRegexp(location.replace(/^[.]+/, ''));

        for (const file of logFiles) {
            const displayName = file.match(regexp)?.slice(1).join(' - ') ?? file;
            logs.push({ displayName, path: file });
        }
    }

    return logs;
}

module.exports = {
    getLogs,
};
