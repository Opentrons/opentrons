/** Ensure that protocol schema v6 definition itself is functions as intended,
 *  and that all v6 protocol fixtures will validate */
import Ajv from 'ajv'
import path from 'path'
import glob from 'glob'
import omit from 'lodash/omit'

import protocolSchema from '../../protocol/schemas/6.json'
import labwareV2Schema from '../../labware/schemas/2.json'
import simpleV6Fixture from '../../protocol/fixtures/6/simpleV6.json'

const fixturesGlobPath = path.join(
  __dirname,
  '../../protocol/fixtures/6/**/*.json'
)

const protocolFixtures = glob.sync(fixturesGlobPath)
const ajv = new Ajv({ allErrors: true, jsonPointers: true })

// v6 protocol schema contains reference to v2 labware schema, so give AJV access to it
ajv.addSchema(labwareV2Schema)

const validateProtocol = ajv.compile(protocolSchema)

describe('validate v6 protocol fixtures under JSON schema', () => {
  protocolFixtures.forEach(protocolPath => {
    it(path.basename(protocolPath), () => {
      const protocol = require(protocolPath)

      const valid = validateProtocol(protocol)
      const validationErrors = validateProtocol.errors

      if (validationErrors) {
        console.log(JSON.stringify(validationErrors, null, 4))
      }

      expect(valid).toBe(true)
      expect(validationErrors).toBe(null)
    })
  })
})

describe('ensure bad protocol data fails validation', () => {
  it('$otSharedSchema is required to be "#/protocol/schemas/6"', () => {
    expect(validateProtocol(omit(simpleV6Fixture, '$otSharedSchema'))).toBe(
      false
    )
    expect(
      validateProtocol({
        ...simpleV6Fixture,
        $otSharedSchema: '#/protocol/schemas/3',
      })
    ).toBe(false)
  })

  it('schemaVersion is required to be 6', () => {
    expect(validateProtocol(omit(simpleV6Fixture, 'schemaVersion'))).toBe(false)
    expect(validateProtocol({ ...simpleV6Fixture, schemaVersion: 3 })).toBe(
      false
    )
  })

  it('reject bad values in "pipettes" objects', () => {
    const badPipettes = {
      missingKeys: {},
      missingName: { mount: 'left' },
      hasAdditionalProperties: {
        mount: 'left',
        name: 'pipetteName',
        blah: 'blah',
      },
    }

    Object.entries(badPipettes).forEach(([pipetteId, pipette]) => {
      expect(
        validateProtocol({
          ...simpleV6Fixture,
          pipettes: {
            ...simpleV6Fixture.pipettes,
            [pipetteId]: pipette,
          },
        })
      ).toBe(false)
    })
  })

  it('reject bad values in "labware" objects', () => {
    const badLabware = {
      noDefId: { displayName: 'myLabware' },
      hasAdditionalProperties: {
        slot: '1',
        definitionId: 'defId',
        blah: 'blah',
      },
    }

    Object.entries(badLabware).forEach(([labwareId, labware]) => {
      expect(
        validateProtocol({
          ...simpleV6Fixture,
          labware: {
            ...simpleV6Fixture.labware,
            [labwareId]: labware,
          },
        })
      ).toBe(false)
    })
  })

  it('reject bad values in "modules" objects', () => {
    const badModules = {
      noModel: { moduleType: 'thermocycler' },
      hasAdditionalProperties: {
        model: 'thermocycler',
        slot: '1',
        blah: 'blah',
      },
    }

    Object.entries(badModules).forEach(([moduleId, module]) => {
      expect(
        validateProtocol({
          ...simpleV6Fixture,
          modules: {
            ...simpleV6Fixture.modules,
            [moduleId]: module,
          },
        })
      ).toBe(false)
    })
  })
})
