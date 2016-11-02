const electron = require('electron')
const fs = require('fs')
const path = require('path')

const {app} = electron
const winston = require('winston')


function createLogger(path, name) {
  fs.appendFileSync(path, '');

  return new (winston.Logger)({
      transports: [
          new (winston.transports.File)({
              level: 'verbose',
              name: name,
              filename: path,
              json: false,
              maxsize: 10*1024*1024,
              maxFiles: 5,
              timestamp: function(){
                const d = new Date();
                return d.toISOString();
              }
          })
      ]
  });
}

function getLogger(name) {
  const logDir = path.join(app.getPath('userData'), 'otone_data')
  try {
    fs.mkdirSync(logDir)
  } catch (e) {
    // file exists..
  }

  const loggerPath = path.join(logDir, name.concat('.log'))
  return createLogger(loggerPath, name)
}


module.exports = {
  createLogger,
  getLogger
}
