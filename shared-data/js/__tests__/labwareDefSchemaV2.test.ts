import path from 'path'
import glob from 'glob'
import Ajv from 'ajv'

import schema from '../../labware/schemas/2.json'
import type { LabwareDefinition2 } from '../types'

import 'regenerator-runtime/runtime'

const definitionsPath = path.join(__dirname, '../../labware/definitions/2')

const definitionsGlobPath = path.join(definitionsPath, '**/*.json')

const fixturesGlobPath = path.join(__dirname, '../../labware/fixtures/2/*.json')

const generateStandardWellNames = (rowCount: number, columnCount: number): Set<string> => {
  function* generateWelllNames() {
    for (let column = 0; column < columnCount; column++) {
      for (let row = 0; row < rowCount; row++) {
        const columnName = (column + 1).toString()
        const rowName = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[row]
        yield rowName + columnName
      }
    }
  }
  return new Set(generateWelllNames())
}

const standard24WellNames = generateStandardWellNames(4, 6);
const standard96WellNames = generateStandardWellNames(8, 12);
const standard384WellNames = generateStandardWellNames(16, 24);

const definitionsWithWellsNotMatchingZDimension: Record<string, Set<string>> = {
  // TODO: Explain all of these with references to RSS-202.
  "geb_96_tiprack_10ul/1.json": standard96WellNames,
  "nest_1_reservoir_195ml/1.json": new Set(["A1"]),
  "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical/1.json": new Set(["A3", "B3", "A4", "B4"]),
  "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1.json": new Set(["A3", "B3", "A4", "B4"]),
  "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical/1.json": new Set(["A3", "B3", "A4", "B4"]),
  "opentrons_24_aluminumblock_generic_2ml_screwcap/1.json": standard24WellNames,
  "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/1.json": standard24WellNames,
  "opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip/1.json": new Set(
    ['A3', 'B3', 'C3', 'D3', 'A4', 'B4', 'C4', 'D4', 'A5', 'B5', 'C5', 'D5', 'A6', 'B6', 'C6', 'D6', 'A7', 'B7', 'C7', 'D7', 'A8', 'B8', 'C8', 'D8']
  ),
  "opentrons_96_aluminumblock_generic_pcr_strip_200ul/1.json": standard96WellNames,
  "opentrons_96_filtertiprack_200ul/1.json": standard96WellNames,
  "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1.json": standard96WellNames,
  "opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt/1.json": standard96WellNames,
  "opentrons_96_tiprack_300ul/1.json": standard96WellNames,
  "opentrons_calibrationblock_short_side_left/1.json": new Set(["A1"]),
  "opentrons_calibrationblock_short_side_right/1.json": new Set(["A2"]),
  "opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat/1.json": standard384WellNames,
}

const definitionsWithWellsHigherThanZDimension: Set<string> = new Set([
  "geb_96_tiprack_10ul/1.json",
  "opentrons_24_aluminumblock_generic_2ml_screwcap/1.json",
  "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/1.json",
  "opentrons_96_aluminumblock_generic_pcr_strip_200ul/1.json",
  "opentrons_96_tiprack_300ul/1.json",
  "opentrons_96_filtertiprack_200ul/1.json",
])

// JSON Schema defintion & setup
const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const expectGroupsFollowConvention = (
  labwareDef: LabwareDefinition2,
  filename: string
): void => {
  test(`${filename} should not contain "groups.brand.brand" that matches the top-level "brand.brand"`, () => {
    const topLevelBrand = labwareDef.brand

    labwareDef.groups.forEach(group => {
      if (group.brand) {
        expect(group.brand.brand).not.toEqual(topLevelBrand)
      }
    })
  })

  test(`${filename} should not specify certain fields in 'groups' if it is a reservoir or wellPlate`, () => {
    const { displayCategory } = labwareDef.metadata
    const noGroupsMetadataAllowed =
      displayCategory === 'reservoir' || displayCategory === 'wellPlate'

    if (noGroupsMetadataAllowed) {
      labwareDef.groups.forEach(group => {
        expect(group.brand).toBe(undefined)
        expect(group.metadata.displayName).toBe(undefined)
        expect(group.metadata.displayCategory).toBe(undefined)
      })
    }
  })
}

const wellsNotMatchingZDimension = (
  labwareDef: LabwareDefinition2
): string[] => {
  return Object.entries(labwareDef.wells).filter(
    ([wellName, wellDef]) => {
      const absDifference = Math.abs(labwareDef.dimensions.zDimension - (wellDef.depth + wellDef.z))
      return absDifference > 0.000001 // Tolerate floating point rounding errors.
    }
  ).map(
    ([wellName, wellDef]) => wellName
  )
}

const wellsHigherThanZDimension = (
  labwareDef: LabwareDefinition2
): string[] => {
  return Object.entries(labwareDef.wells).filter(
    ([wellName, wellDef]) => {
      const difference = (wellDef.depth + wellDef.z) - labwareDef.dimensions.zDimension
      return difference > 0.000001 // Tolerate floating point rounding errors.
    }
  ).map(
    ([wellName, wellDef]) => wellName
  )
}

test('fail on bad labware', () => {
  const badDef = {
    metadata: { name: 'bad' },
    ordering: ['A1'],
    // array of strings not array of arrays
    wells: {},
  }
  const valid = validate(badDef)
  const validationErrors = validate.errors

  expect(
    validationErrors?.find(err => err.dataPath === '/ordering/0')
  ).toMatchObject({
    message: 'should be array',
  })
  expect(valid).toBe(false)
})

describe('test schemas of all opentrons definitions', () => {
  const labwarePaths = glob.sync(definitionsGlobPath)

  beforeAll(() => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  labwarePaths.forEach(labwarePath => {
    const filename = path.parse(labwarePath).base
    const labwareDef = require(labwarePath) as LabwareDefinition2

    it(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })

    it(`file name matches version: ${labwarePath}`, () => {
      expect(`${labwareDef.version}`).toEqual(path.basename(filename, '.json'))
    })

    it(`parent dir matches loadName: ${labwarePath}`, () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(path.dirname(labwarePath))
      )
    })

    it(`namespace is "opentrons": ${labwarePath}`, () => {
      expect(labwareDef.namespace).toEqual('opentrons')
    })

    if (labwareDef.parameters.loadName !== 'nest_96_wellplate_2ml_deep') {
      // TODO(IL, 2020-06-22): make nest_96_wellplate_2ml_deep confirm to groups convention
      expectGroupsFollowConvention(labwareDef, labwarePath)
    }
  })
})

describe('test dimensional consistency of all opentrons definitions', () => {
  const labwarePaths = glob.sync("**/*.json", {cwd: definitionsPath})

  beforeAll(() => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  describe.each(labwarePaths)('%s', (labwarePath) => {
    const fullLabwarePath = path.join(definitionsPath, labwarePath)
    const labwareDef = require(fullLabwarePath) as LabwareDefinition2

    // TODO: "bad" is the wrong word here
    const expectedBadWells = definitionsWithWellsNotMatchingZDimension[labwarePath] ?? new Set()
    it(`has the expected ${expectedBadWells.size} bad wells`, () => {
      const actualBadWells = new Set(wellsNotMatchingZDimension(labwareDef))
      expect(actualBadWells).toEqual(expectedBadWells)
    })

    const tooHighWellsAreExpected = definitionsWithWellsHigherThanZDimension.has(labwarePath)
    it(`${tooHighWellsAreExpected? "has" : "does not have"} wells whose heights are above the labware's zDimension`, () => {
      const hasTooHighWells = wellsHigherThanZDimension(labwareDef).length > 0
      expect(hasTooHighWells).toEqual(tooHighWellsAreExpected)
    })
  })
})

describe('test schemas of all v2 labware fixtures', () => {
  const labwarePaths = glob.sync(fixturesGlobPath)

  beforeAll(() => {
    // Make sure fixtures path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  labwarePaths.forEach(labwarePath => {
    const filename = path.parse(labwarePath).base
    const labwareDef = require(labwarePath) as LabwareDefinition2

    it(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })

    it(`fixture file name matches loadName: ${labwarePath}`, () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(filename, '.json')
      )
    })

    it(`namespace is "fixture": ${labwarePath}`, () => {
      expect(labwareDef.namespace).toEqual('fixture')
    })

    expectGroupsFollowConvention(labwareDef, filename)
  })
})
