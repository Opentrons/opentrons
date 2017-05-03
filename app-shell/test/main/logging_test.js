const { expect } = require('chai')
const fs = require('fs')
const path = require('path')
const os = require('os')

const { getLogger } = require('../../app/main/logging')

describe('test logging module', function () {
  it('creates a logging dir', function () {
    process.env['APP_DATA_DIR'] = os.tmpdir()
    const logger = getLogger('test-file')
    expect(logger).to.be.ok
    expect(fs.existsSync(path.join(os.tmpdir(), 'test-file.log'))).to.be.true
  })
})
