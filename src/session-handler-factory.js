// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import bunyan from 'bunyan';
import Docker from 'dockerode';
const log     = bunyan.createLogger({name: 'sessionHandler'});

const docker  = new Docker({socketPath: '/var/run/docker.sock'});

const spaces = (text, length) => ' '.repeat((length - text.length) + 1);
const header = container => "\r\n" +
" ###############################################################\r\n" +
" ## Docker SSH ~ Because every container should be accessible ##\r\n" +
" ###############################################################\r\n" +
` ## container | ${container}${spaces(container, 45)}##\r\n` +
" ###############################################################\r\n" +
"\r\n";

export default (filters, shell, shell_user) => ({
  instance() {
    let session = null;
    let channel = null;
    let stream = null;
    let resizeTerm = null;
    session = null;

    const closeChannel = function() {
      if (channel) { channel.exit(0); }
      if (channel) { return channel.end(); }
    };
    const stopTerm = function() {
      if (stream) { return stream.end(); }
    };

    return {
      close() { return stopTerm(); },
      handler(accept, reject) {
        session = accept();
        let termInfo = null;

        let _container = null;

        return docker.listContainers({filters}, function(err, containers) { // FIXME: handle no such container
          const containerInfo = containers?.[0];
          const _containerName = containerInfo?.Names?.[0];
          _container = docker.getContainer(containerInfo?.Id);

          session.once('exec', function(accept, reject, info) {
            log.info({container: _containerName, command: info.command}, 'Exec');
            channel = accept();
            const execOpts = {
              Cmd: [shell, '-c', info.command],
              AttachStdin: true,
              AttachStdout: true,
              AttachStderr: true,
              Tty: false
            };
            if (shell_user) { execOpts['User'] = shell_user; }
            return _container.exec(execOpts, function(err, exec) {
              if (err) {
                log.error({container: _containerName}, 'Exec error', err);
                return closeChannel();
              }
              return exec.start({stdin: true, Tty: true}, function(err, _stream) {
                stream = _stream;
                stream.on('data', data => channel.write(data.toString()));
                stream.on('error', function(err) {
                  log.error({container: _containerName}, 'Exec error', err);
                  return closeChannel();
                });
                stream.on('end', function() {
                  log.info({container: _containerName}, 'Exec ended');
                  return closeChannel();
                });
                channel.on('data', data => stream.write(data));
                channel.on('error', e => log.error({container: _containerName}, 'Channel error', e));
                return channel.on('end', function() {
                  log.info({container: _containerName}, 'Channel exited');
                  return stopTerm();
                });
              });
            });
          });

          session.on('err', err => log.error({container: _containerName}, err));

          session.on('shell', function(accept, reject) {
            log.info({container: _containerName}, 'Opening shell');
            channel = accept();
            channel.write(`${header(_containerName)}`);
            const execOpts = {
              Cmd: [shell],
              AttachStdin: true,
              AttachStdout: true,
              AttachStderr: true,
              Tty: true
            };
            if (shell_user) { execOpts['User'] = shell_user; }
            return _container.exec(execOpts, function(err, exec) {
              if (err) {
                log.error({container: _containerName}, 'Exec error', err);
                return closeChannel();
              }
              return exec.start({stdin: true, Tty: true}, function(err, _stream) {
                stream = _stream;
                let forwardData = false;
                setTimeout((function() { forwardData = true; return stream.write('\n'); }), 500);
                stream.on('data', function(data) {
                  if (forwardData) {
                    return channel.write(data.toString());
                  }
                });
                stream.on('error', function(err) {
                  log.error({container: _containerName}, 'Terminal error', err);
                  return closeChannel();
                });
                stream.on('end', function() {
                  log.info({container: _containerName}, 'Terminal exited');
                  return closeChannel();
                });

                stream.write('export TERM=linux;\n');
                stream.write('export PS1="\\w $ ";\n\n');

                channel.on('data', data => stream.write(data));
                channel.on('error', e => log.error({container: _containerName}, 'Channel error', e));
                channel.on('end', function() {
                  log.info({container: _containerName}, 'Channel exited');
                  return stopTerm();
                });

                resizeTerm = function(termInfo) {
                  if (termInfo) { return exec.resize({h: termInfo.rows, w: termInfo.cols}, () => undefined); }
                };
                return resizeTerm(termInfo);
              });
            });
          }); // initially set the current size of the terminal

          session.on('pty', function(accept, reject, info) {
            const x = accept();
            return termInfo = info;
          });

          return session.on('window-change', function(accept, reject, info) {
            log.info({container: _containerName}, 'window-change', info);
            return resizeTerm(info);
          });
        });
      }
    };
  }
});
