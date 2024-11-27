/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let password, user;
import bunyan from 'bunyan';
const log     = bunyan.createLogger({name: 'multiUserAuth'});
const env     = require('../env');

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
