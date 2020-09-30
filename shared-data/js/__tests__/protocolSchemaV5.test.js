// @flow
/** Ensure that protocol schema v5 definition itself is functions as intended,
 *  and that all v5 protocol fixtures will validate */
import Ajv from 'ajv'
import path from 'path'
import glob from 'glob'
import omit from 'lodash/omit'
import protocolSchema from '../../protocol/schemas/5.json'
import labwareV2Schema from '../../labware/schemas/2.json'
import simpleV5Fixture from '../../protocol/fixtures/5/simpleV5.json'

const fixturesGlobPath = path.join(
  __dirname,
  '../../protocol/fixtures/5/**/*.json'
)
const protocolFixtures = glob.sync(fixturesGlobPath)

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

// v5 protocol schema contains reference to v2 labware schema, so give AJV access to it
ajv.addSchema(labwareV2Schema)

const validateProtocol = ajv.compile(protocolSchema)

describe('validate v5 protocol fixtures under JSON schema', () => {
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
  it('$otSharedSchema is required to be "#/protocol/schemas/5"', () => {
    expect(validateProtocol(omit(simpleV5Fixture, '$otSharedSchema'))).toBe(
      false
    )
    expect(
      validateProtocol({
        ...simpleV5Fixture,
        $otSharedSchema: '#/protocol/schemas/6',
      })
    ).toBe(false)
  })

  it('schemaVersion is required to be 5', () => {
    expect(validateProtocol(omit(simpleV5Fixture, 'schemaVersion'))).toBe(false)
    expect(validateProtocol({ ...simpleV5Fixture, schemaVersion: 3 })).toBe(
      false
    )
  })

  it('reject bad values in "pipettes" objects', () => {
    const badPipettes = {
      missingKeys: {},
      missingName: { mount: 'left' },
      missingMount: { name: 'pipetteName' },
      badMount: { mount: 'blah', name: 'pipetteName' },
      hasAdditionalProperties: {
        mount: 'left',
        name: 'pipetteName',
        blah: 'blah',
      },
    }

    Object.keys(badPipettes).forEach((pipetteId: string) => {
      expect(
        validateProtocol({
          ...simpleV5Fixture,
          pipettes: {
            ...simpleV5Fixture.pipettes,
            [pipetteId]: badPipettes[pipetteId],
          },
        })
      ).toBe(false)
    })
  })

  it('reject bad values in "labware" objects', () => {
    const badLabware = {
      noSlot: { definitionId: 'defId' },
      noDefId: { slot: '1' },
      hasAdditionalProperties: {
        slot: '1',
        definitionId: 'defId',
        blah: 'blah',
      },
    }

    Object.keys(badLabware).forEach((labwareId: string) => {
      expect(
        validateProtocol({
          ...simpleV5Fixture,
          labware: {
            ...simpleV5Fixture.labware,
            [labwareId]: badLabware[labwareId],
          },
        })
      ).toBe(false)
    })
  })

  it('reject bad values in "modules" objects', () => {
    const badModules = {
      badModuleType: { slot: '1', moduleType: 'fake' },
      noSlot: { moduleType: 'thermocycler' },
      noModuleType: { slot: '1' },
      hasAdditionalProperties: {
        slot: '1',
        moduleType: 'thermocycler',
        blah: 'blah',
      },
    }

    Object.keys(badModules).forEach((moduleId: string) => {
      expect(
        validateProtocol({
          ...simpleV5Fixture,
          modules: {
            ...simpleV5Fixture.modules,
            [moduleId]: badModules[moduleId],
          },
        })
      ).toBe(false)
    })
  })
})
