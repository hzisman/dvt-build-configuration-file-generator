const globPromise = require('glob-promise');
const os = require('os');
const path = require('path');
const globCaptureRegex = require('glob-capture-regex');


/**
 * Get a list of log files from specified search locations.
 * @param {string} workingDirectory - The directory to search for logs.
 * @param {string[]} searchLocations - The list of locations to search for log files.
 * @param {string[]} excludeSearchLocations - The list of locations to exclude from the search.
 * @returns {Promise<Array<{ displayName: string, path: string }>>} - A list of log files with display names and paths.
 */
async function getLogs(workingDirectory, searchLocations, excludeSearchLocations) {
    const logs = [];

    for (const location of searchLocations) {
        const formattedLocation = location.startsWith('~')
            ? path.posix.join(os.homedir(), location.slice(1))
            : location.startsWith('/')
                ? location
                : path.posix.join(workingDirectory, location);

        const { glob } = globCaptureRegex(formattedLocation);

        const logFiles = await globPromise(glob);

        // Remove leading dots from location to match with file names
        const { regex } = globCaptureRegex(location.replace(/^([.]+|~)/, '**'));

        for (const file of logFiles) {
            if (excludeSearchLocations.some(loc => globCaptureRegex(loc).regex.test(file))) {
                continue;
            }

            const displayName = file.match(regex)?.slice(1).join(' - ') ?? file;
            logs.push({ displayName, path: file });
        }
    }

    return logs;
}

module.exports = {
    getLogs,
};
