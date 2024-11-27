// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let password, user;
import bunyan from 'bunyan';
import env from '../env.js';

const log = bunyan.createLogger({name: 'multiUserAuth'});
const tuples = env.assert('AUTH_TUPLES');

const security = {};

for (var tuple of Array.from(tuples.split(';'))) {
    [user, password] = Array.from(tuple.split(':'));
    security[user] = password;
}

export default function(ctx) {
    if (ctx.method === 'password') {
        if (security[ctx.username] === ctx.password) {
            log.info({user: ctx.username}, 'Authentication succeeded');
            return ctx.accept();
        } else {
            log.warn({user: ctx.username, password: ctx.password}, 'Authentication failed');
        }
    }
    return ctx.reject(['password']);
};
