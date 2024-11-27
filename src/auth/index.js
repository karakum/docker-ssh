// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
export default async function(authType) {
  switch (authType) {
    case 'noAuth':
      return (await import('./noAuthHandler.js')).default;
    case 'simpleAuth':
      return (await import('./simpleAuth.js')).default;
    case 'multiUser':
      return (await import('./multiUserAuth.js')).default;
    case 'publicKey':
      return (await import('./publicKeyAuth.js')).default;
    default:
      return null;
  }
};
