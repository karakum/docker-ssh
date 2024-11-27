// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
export default function(authType) {
  switch (authType) {
    case 'noAuth': return require('./noAuthHandler');
    case 'simpleAuth': return require('./simpleAuth');
    case 'multiUser': return require('./multiUserAuth');
    case 'publicKey': return require('./publicKeyAuth');
    default: return null;
  }
};
