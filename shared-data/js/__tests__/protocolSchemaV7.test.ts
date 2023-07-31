/** Ensure that protocol schema v7 definition itself functions as intended,
 *  and that all v7 protocol fixtures will validate */
import Ajv from 'ajv'
import path from 'path'
import glob from 'glob'
import omit from 'lodash/omit'

import protocolSchema from '../../protocol/schemas/7.json'
import labwareV2Schema from '../../labware/schemas/2.json'
import commandV7Schema from '../../command/schemas/7.json'
import simpleV7Fixture from '../../protocol/fixtures/7/simpleV7.json'

const fixturesGlobPath = path.join(
  __dirname,
  '../../protocol/fixtures/7/**/*.json'
)

const protocolFixtures = glob.sync(fixturesGlobPath)
const ajv = new Ajv({ allErrors: true, jsonPointers: true })

// v7 protocol schema contains reference to v2 labware schema, and v7 command schema, so give AJV access to it
ajv.addSchema(labwareV2Schema)
ajv.addSchema(commandV7Schema)

const validateProtocol = ajv.compile(protocolSchema)

describe('validate v7 protocol fixtures under JSON schema', () => {
  protocolFixtures.forEach(protocolPath => {
    it(path.basename(protocolPath), () => {
      const protocol = require(protocolPath)

      const valid = validateProtocol(protocol)
      const validationErrors = validateProtocol.errors

      if (validationErrors) {
        console.log(JSON.stringify(validationErrors, null, 4))
      }

      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })
  })
})

describe('ensure bad protocol data fails validation', () => {
  it('$otSharedSchema is required to be "#/protocol/schemas/7"', () => {
    expect(validateProtocol(omit(simpleV7Fixture, '$otSharedSchema'))).toBe(
      false
    )
    expect(
      validateProtocol({
        ...simpleV7Fixture,
        $otSharedSchema: '#/protocol/schemas/3',
      })
    ).toBe(false)
  })

  it('schemaVersion is required to be 7', () => {
    expect(validateProtocol(omit(simpleV7Fixture, 'schemaVersion'))).toBe(false)
    expect(validateProtocol({ ...simpleV7Fixture, schemaVersion: 3 })).toBe(
      false
    )
  })
})
