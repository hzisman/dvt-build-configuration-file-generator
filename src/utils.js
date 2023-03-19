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
    text,
};
