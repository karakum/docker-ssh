// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import bunyan from 'bunyan';
const log     = bunyan.createLogger({name: 'simpleAuth'});
const env     = require('../env');

const username = env.assert('AUTH_USER');
const password = env.assert('AUTH_PASSWORD');

export default function(ctx) {
  if (ctx.method === 'password') {
    if ((ctx.username === username) && (ctx.password === password)) {
      log.info({user: username}, 'Authentication succeeded');
      return ctx.accept();
    } else {
      log.warn({user: ctx.username, password: ctx.password}, 'Authentication failed');
    }
  }
  return ctx.reject(['password']);
};
