const globToRegexp = require('glob-to-regexp');

/**
 * Validates if the globWithGroups is a valid string.
 * @param {string} globWithGroups - The glob string with groups to be validated.
 * @throws {Error} Throws an error if the globWithGroups string is invalid.
 */
function validateGlobWithGroups(globWithGroups) {
    // Check if the glob string contains adjacent groups.
    if (globWithGroups.includes(')(')) {
        throw new Error('Glob pattern could not contain adjacent groups.');
    }

    // Check if the glob string contains invalid groups.
    if (!/^[^()]*(\([^()]+\)[^()]*)*$/.test(globWithGroups)) {
        throw new Error('Glob pattern groups are not valid');
    }
}

/**
 * Converts a glob string with groups to a regular glob string without groups.
 * @param {string} globWithGroups - The glob string with groups to be converted.
 * @returns {string} Returns a regular glob string without groups.
 * @throws {Error} Throws an error if the globWithGroups string is invalid.
 */
function globWithGroupsToGlob(globWithGroups) {
    validateGlobWithGroups(globWithGroups);

    // Remove all parentheses from the glob string.
    return globWithGroups.replace(/[()]/g, '');
}

/**
 * Converts a glob string with groups to a regular expression string.
 * @param {string} globWithGroups - The glob string with groups to be converted.
 * @returns {string} Returns a regular expression string.
 * @throws {Error} Throws an error if the globWithGroups string is invalid.
 */
function globWithGroupsToRegexp(globWithGroups) {
    validateGlobWithGroups(globWithGroups);

    // Split the glob string into parts and convert each part to a regular expression.
    const splitted = (globWithGroups.startsWith('(') ? [''] : []).concat(
        globWithGroups.split(/[()]/).map(globToRegexp).map(part => part.source.replace(/[\$\^]/g, '')),
    );

    // Join the parts into a single regular expression string.
    let regexp = '';
    while (splitted.length) {
        if (splitted.length === 1) {
            regexp += splitted.shift();
        } else {
            regexp += `${splitted.shift()}(${splitted.shift()})`;
        }
    }

    return regexp;
}

module.exports = {
    globWithGroupsToGlob,
    globWithGroupsToRegexp,
};