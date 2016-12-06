const fs = require('fs')
const path = require('path')
const winston = require('winston')

function createLogger (path, name) {
  fs.appendFileSync(path, '')

  return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({
        level: 'verbose',
        name: name,
        filename: path,
        json: false,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        timestamp: function () {
          const d = new Date()
          return d.toISOString()
        }
      })
    ]
  })
}

function getLogger (name) {
  const logDir = process.env.APP_DATA_DIR
  const loggerPath = path.join(logDir, name.concat('.log'))
  return createLogger(loggerPath, name)
}

module.exports = {
  createLogger,
  getLogger
}
