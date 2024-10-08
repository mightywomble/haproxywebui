const { exec } = require('child_process');

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function getHAProxyStatus() {
  return executeCommand('systemctl is-active haproxy');
}

function startHAProxy() {
  return executeCommand('sudo systemctl start haproxy');
}

function stopHAProxy() {
  return executeCommand('sudo systemctl stop haproxy');
}

module.exports = { getHAProxyStatus, startHAProxy, stopHAProxy };