const globCaptureRegex = require('glob-capture-regex');

/**
 * Transforms a path based on a set of specified transformations.
 *
 * @param {string} path - The original path to transform.
 * @param {Array<{ from: string, to: string }>} transformations - An array of transformation objects.
 * @returns {string} - The transformed path.
 */
function transformPath(path, transformations) {
    let transformed = path;
    for (const { from, to } of transformations) {
        const { regex: { source } } = globCaptureRegex(from);
        // remove the `^` and the `$` chars from the regular expression
        const regex = new RegExp(source.slice(1, source.length - 1));
        transformed = transformed.replace(regex, to);
    }

    return transformed;
}

/**
 * Returns true if the string can be a valid path otherwise false
 * 
 * @param {string} string 
 * @returns {boolean} 
 */
function isPath(string) {
    return string.indexOf(' ') === -1 && /\.\w+/.test(string) && !/^[-+]/.test(string);
}

/**
 * Returns true if the line can be a valid line in the .build file otherwise false
 * 
 * @param {string} line 
 * @returns {boolean}
 */
function isValidDvtBuildConfigLine(line) {
    let validFlags = [
        '-y ',
        '-v ',
        '+incdir+',
        '+dvt_',
        '#',
        '+define+',
        '-f ',
        '-top ',
    ]

    return validFlags.some(flag => line.startsWith(flag)) || isPath(line);
}

/**
 * Formats text by removing leading and trailing whitespace from each line.
 *
 * @param {string} unformattedText - The unformatted text to format.
 * @returns {string} - The formatted text.
 */
function text(unformattedText) {
    return unformattedText.split('\n').map(line => line.trim()).join('\n');
}

module.exports = {
    transformPath,
    isValidDvtBuildConfigLine,
    text,
};
