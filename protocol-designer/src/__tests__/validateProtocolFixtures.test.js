// @flow
import Ajv from 'ajv'
import glob from 'glob'
import last from 'lodash/last'
import path from 'path'
import protocolV1Schema from '@opentrons/shared-data/protocol/schemas/1.json'
import protocolV3Schema from '@opentrons/shared-data/protocol/schemas/3.json'
import protocolV4Schema from '@opentrons/shared-data/protocol/schemas/4.json'
import protocolV5Schema from '@opentrons/shared-data/protocol/schemas/5.json'
import labwareV2Schema from '@opentrons/shared-data/labware/schemas/2.json'

// TODO: copied from createFile.test.js
const getAjvValidator = _protocolSchema => {
  const ajv = new Ajv({
    allErrors: true,
    jsonPointers: true,
  })
  // v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
  ajv.addSchema(labwareV2Schema)
  const validateProtocol = ajv.compile(_protocolSchema)
  return validateProtocol
}

const expectResultToMatchSchema = (testName, result, _protocolSchema): void => {
  const validate = getAjvValidator(_protocolSchema)
  const valid = validate(result)
  const validationErrors = validate.errors

  if (validationErrors) {
    console.log(`===== ERRORS FOR ${testName} =====`)
    console.log(JSON.stringify(validationErrors, null, 4))
  }
  expect(valid).toBe(true)
  expect(validationErrors).toBe(null)
}

const getSchemaDefForProtocol = (protocol: any): any => {
  // For reference, possibilities are, from newest to oldest:
  // "$otSharedSchema": "#/protocol/schemas/5"
  // "schemaVersion": 3
  // "protocol-schema": "1.0.0"
  let n
  if (typeof protocol.$otSharedSchema === 'string') {
    n = last(protocol.$otSharedSchema.split('/')) || `${protocol.schemaVersion}`
  } else if (protocol.schemaVersion) {
    n = `${protocol.schemaVersion}`
  } else if (protocol['protocol-schema']) {
    n = protocol['protocol-schema'].split('.')[0]
  }

  switch (n) {
    case '1':
      return protocolV1Schema
    case '3':
      return protocolV3Schema
    case '4':
      return protocolV4Schema
    case '5':
      return protocolV5Schema
  }

  const errorMessage = `bad schema for protocol!: ${
    n
      ? `'${n}'. Does a new schema need to be added to validateProtocolFixtures.test.js?`
      : 'Could not determine schema.'
  }`
  throw new Error(errorMessage)
}

describe('Protocol fixtures should validate under their JSON schemas', () => {
  const fixtureDirsGlobPath = path.join(
    __dirname,
    '../../fixtures/protocol/**/*.json'
  )
  const fixturePaths = glob.sync(fixtureDirsGlobPath)

  fixturePaths.forEach(protocolPath => {
    it(path.basename(protocolPath), () => {
      const protocol = require(protocolPath)
      expectResultToMatchSchema(
        protocolPath,
        protocol,
        getSchemaDefForProtocol(protocol)
      )
    })
  })
})
