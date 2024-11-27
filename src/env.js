// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const defaultExport = {};
// Asserts that environment variable is set and returns its value.
// When not set, the application will exit
defaultExport.assert = function(envName) {
    let env;
    if (!(env = process.env[envName])) {
        console.error(`Configuration error: Environment variable '${envName}' not set.`);
        return process.exit(1);
    } else {
        return env;
    }
};
export default defaultExport;
