// @flow
/** Ensure that protocol schema v4 definition itself is functions as intended,
 *  and that all v4 protocol fixtures will validate */
import path from 'path'
import Ajv from 'ajv'
import glob from 'glob'
import omit from 'lodash/omit'
import protocolSchema from '../../protocol/schemas/4.json'
import labwareV2Schema from '../../labware/schemas/2.json'
import simpleV4Fixture from '../../protocol/fixtures/4/simpleV4.json'

const fixturesGlobPath = path.join(
  __dirname,
  '../../protocol/fixtures/4/**/*.json'
)
const protocolFixtures = glob.sync(fixturesGlobPath)

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})

// v4 protocol schema contains reference to v2 labware schema, so give AJV access to it
ajv.addSchema(labwareV2Schema)

const validateProtocol = ajv.compile(protocolSchema)

describe('validate v4 protocol fixtures under JSON schema', () => {
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
  it('$otSharedSchema is required to be "#/protocol/schemas/4"', () => {
    expect(validateProtocol(omit(simpleV4Fixture, '$otSharedSchema'))).toBe(
      false
    )
    expect(
      validateProtocol({
        ...simpleV4Fixture,
        $otSharedSchema: '#/protocol/schemas/5',
      })
    ).toBe(false)
  })

  it('schemaVersion is required to be 4', () => {
    expect(validateProtocol(omit(simpleV4Fixture, 'schemaVersion'))).toBe(false)
    expect(validateProtocol({ ...simpleV4Fixture, schemaVersion: 3 })).toBe(
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
          ...simpleV4Fixture,
          pipettes: {
            ...simpleV4Fixture.pipettes,
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
          ...simpleV4Fixture,
          labware: {
            ...simpleV4Fixture.labware,
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
          ...simpleV4Fixture,
          modules: {
            ...simpleV4Fixture.modules,
            [moduleId]: badModules[moduleId],
          },
        })
      ).toBe(false)
    })
  })
})
