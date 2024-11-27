// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import fs from 'fs';
import ssh2 from 'ssh2';
import bunyan from 'bunyan';
import authHandlerFactory from './src/auth/index.js';
import webserver from './src/webserver.js';
import sessionHandlerFactory from './src/session-handler-factory.js';

const log = bunyan.createLogger({name: 'sshServer'});
const sshPort = process.env.PORT || 22;
const httpPort = process.env.HTTP_PORT || 80;
let httpEnabled = process.env.HTTP_ENABLED || true;
const ip = process.env.IP || '0.0.0.0';
const keypath = process.env.KEYPATH;
let filters = process.env.FILTERS;
const container = process.env.CONTAINER;
const shell = process.env.CONTAINER_SHELL;
const shell_user = process.env.SHELL_USER;
const authMechanism = process.env.AUTH_MECHANISM;
const authenticationHandler = await authHandlerFactory(authMechanism);

httpEnabled = (httpEnabled === 'true') || (httpEnabled === true);

const exitOnConfigError = function(errorMessage) {
    console.error(`Configuration error: ${errorMessage}`);
    return process.exit(1);
};

if (!filters && !container) {
    exitOnConfigError('No FILTERS specified');
}
if (!keypath) {
    exitOnConfigError('No KEYPATH specified');
}
if (!shell) {
    exitOnConfigError('No CONTAINER_SHELL specified');
}
if (!authMechanism) {
    exitOnConfigError('No AUTH_MECHANISM specified');
}
if (!authenticationHandler) {
    exitOnConfigError(`Unknown AUTH_MECHANISM: ${authMechanism}`);
}

const options =
    {privateKey: fs.readFileSync(keypath)};

// support CONTAINER parameter for backwards compatibility
// Apparently the name filter also matches on partial names
// It turns out the name filter accepts a regular expression to do an exact match
// See: https://forums.docker.com/t/how-to-filter-docker-ps-by-exact-name/2880
if ((!filters) && container) {
    filters = {'name': [`^/${container}$`]};
}
log.info({filter: filters}, 'Docker filter');

const sessionFactory = sessionHandlerFactory(filters, shell, shell_user);

const sshServer = new ssh2.Server(options, function(client, info) {
    const session = sessionFactory.instance();
    log.info({clientIp: info.ip}, 'Client connected');
    client.on('authentication', authenticationHandler);
    client.on('ready', () => client.on('session', session.handler));
    return client.on('end', function() {
        log.info({clientIp: info.ip}, 'Client disconnected');
        return session.close();
    });
});

sshServer.listen(sshPort, ip, function() {
    log.info('Docker-SSH ~ Because every container should be accessible');
    return log.info({host: this.address().address, port: this.address().port}, 'Listening');
});

if (httpEnabled) {
    webserver.start(httpPort, sessionFactory);
}
