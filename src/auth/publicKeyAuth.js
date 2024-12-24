// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import bunyan from 'bunyan';
import buffersEqual from 'buffer-equal-constant-time';
import ssh2_streams from 'ssh2-streams';
import crypto from 'crypto';
import fs from 'fs';
import env from '../env.js';

const log = bunyan.createLogger({name: 'publicKeyAuth'});
const authorizedKeysFile = env.assert('AUTHORIZED_KEYS');

export default function(ctx) {
    if (ctx.method === 'publickey') {
        // try to find a match in the authorized keys
        log.info({user: ctx.username}, 'Checking public key against authorized keys');
        let authorizedKey = null;
        let authorizedKeyIndex = 0;
        fs.readFileSync(authorizedKeysFile)
            .toString()
            .split('\n')
            .forEach(function(line) {
                authorizedKeyIndex++;
                if (line.length > 0) {
                    const pubKey = ssh2_streams.utils.parseKey(line);
                    if ((ctx.key.algo === pubKey.type) && buffersEqual(ctx.key.data, pubKey.getPublicSSH())) {
                        log.info('Found authorized key matching client key at ' + authorizedKeysFile + ':' + authorizedKeyIndex);
                        return authorizedKey = pubKey;
                    }
                }
            });

        // no match: reject
        if (authorizedKey === null) {
            log.info('No authorized key matching the client key');
            return ctx.reject();
        }

        if (ctx.signature && ctx.sigAlgo) {
            const verifier = crypto.createVerify(ctx.sigAlgo);
            verifier.update(ctx.blob);
            if (verifier.verify(authorizedKey.getPublicSSH(), ctx.signature)) {
                log.info({user: ctx.username}, 'Public key auth succeeded');
                return ctx.accept();
            } else {
                log.warn({user: ctx.username}, 'Authentication failed');
                return ctx.reject();
            }
        } else {
            // if no signature present, that means the client is just checking
            // the validity of the given public key
            log.info({user: ctx.username}, 'No signature, the client is just checking validity of given public key');
            return ctx.accept();
        }
    }

    return ctx.reject(['publickey']);
};