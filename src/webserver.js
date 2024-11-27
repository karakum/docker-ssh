// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import express from 'express';
import bodyParser from 'body-parser';
import bunyan from 'bunyan';

const app = express();
const webLog = bunyan.createLogger({name: 'webserver'});

export default {

    start(port, sessionFactory) {

        let server;
        app.use(express.static('src/public'));
        app.use(bodyParser.urlencoded({extended: false}));

        const eventHandlers = [];
        const addEventHandler = function(connectionId, event, cb) {
            if (!eventHandlers[connectionId]) {
                eventHandlers[connectionId] = {};
            }
            return eventHandlers[connectionId][event] = cb;
        };

        const webSession = (res, connectionId) => (function() {
            const channel = () => ({
                write(data) {
                    res.write('event: data\n');
                    return res.write(`data: ${JSON.stringify(data)}\n\n`);
                },

                on(event, cb) {
                    return addEventHandler(connectionId, `channel:${event}`, cb);
                },

                end() {
                    webLog.info('Websession end', {connectionId});
                    delete eventHandlers[connectionId];
                    return res.end();
                },
            });

            return {
                once() {
                },
                on(event, cb) {
                    switch (event) {
                        case 'shell':
                            return cb(channel);
                        default:
                            return addEventHandler(connectionId, `session:${event}`, cb);
                    }
                },
            };
        });

        app.get('/api/v1/terminal/stream/', function(req, res) {
            const terminalId = crypto.randomUUID();
            webLog.info('New terminal session', {terminalId});
            res.setHeader('Connection', 'Transfer-Encoding');
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.write('event: connectionId\n');
            res.write(`data: ${terminalId}\n\n`);
            sessionFactory.instance()
                .handler(webSession(res, terminalId));

            return res.on('close', () => eventHandlers?.[terminalId]?.['channel:end']?.());
        });

        app.post('/api/v1/terminal/send/:terminalId', function(req, res) {
            const {
                terminalId,
            } = req.params;
            const {
                data,
            } = req.body;
            if (eventHandlers[terminalId]['channel:data']) {
                eventHandlers[terminalId]['channel:data'](data);
            } else {
                webLog.error('No input handler for connection', {connectionId});
            }
            return res.end();
        });

        app.post('/api/v1/terminal/resize-window/:terminalId', function(req, res) {
            const {
                terminalId,
            } = req.params;
            const info = {
                rows: parseInt(req.body.rows),
                cols: parseInt(req.body.cols),
            };
            eventHandlers[terminalId]['session:window-change'](null, null, info);
            res.json(info);
            return res.end();
        });

        return server = app.listen(port, function() {
            const host = server.address().address;
            ({
                port,
            } = server.address());
            return webLog.info({host, port}, 'Listening');
        });
    },
};
