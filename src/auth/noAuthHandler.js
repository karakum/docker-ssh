// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import bunyan from 'bunyan';

const log = bunyan.createLogger({name: 'noAuthHandler'});

export default function(ctx) {
    log.error('NoAuthentication handler is handling the authentication! This is INSECURE!');
    return ctx.accept();
};
