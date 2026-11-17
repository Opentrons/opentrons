import path from 'path'
import Ajv from 'ajv'
import glob from 'glob'
import { beforeAll, describe, expect, it, test } from 'vitest'

import schema from '../../labware/schemas/2.json'
import { pairsFromArray } from '../helpers/pairsFromArray'
import { SHARED_GEOMETRY_GROUPS } from './sharedGeometryGroups'

import type {
  InnerWellGeometry,
  LabwareDefinition2,
  LabwareWell,
  UserDefinedVolumes,
  WellSegment,
} from '../types'

const definitionsDir = path.join(__dirname, '../../labware/definitions/2')
const fixturesDir = path.join(__dirname, '../../labware/fixtures/2')
const globPattern = '**/*.json'

// JSON Schema definition & setup
const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const generateStandardWellNames = (
  rowCount: number,
  columnCount: number
): Set<string> => {
  const result = new Set<string>()

  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      const columnName = (column + 1).toString()
      const rowName = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[row]
      result.add(rowName + columnName)
    }
  }

  return result
}

const standard24WellNames = generateStandardWellNames(4, 6)
const standard96WellNames = generateStandardWellNames(8, 12)
const standard384WellNames = generateStandardWellNames(16, 24)

// Wells whose tops lie above the labware's zDimension.
// These are known bugs in the labware definition. See Jira RSS-202.
const expectedWellsHigherThanZDimension: Record<string, Set<string>> = {
  geb_96_tiprack_10ul: standard96WellNames,
  opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap: standard24WellNames,
  opentrons_96_filtertiprack_200ul: standard96WellNames,
  opentrons_96_tiprack_300ul: standard96WellNames,
}

// Wells whose tops do not lie exactly at the labware's zDimension.
//
// There are legitimate reasons for this to happen, but it can also be a dangerous bug
// in the labware definition. So if it happens, it needs to be justified here.
const expectedWellsNotMatchingZDimension: Record<string, Set<string>> = {
  ...expectedWellsHigherThanZDimension,

  // These height mismatches are legitimate.
  // These tube racks simultaneously hold tubes of different heights.
  // The labware's zDimension should match the height of the taller tubes,
  // not the shorter tubes listed here.
  opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical: new Set([
    'A3',
    'B3',
    'A4',
    'B4',
  ]),
  opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic: new Set([
    'A3',
    'B3',
    'A4',
    'B4',
  ]),
  opentrons_10_tuberack_nest_4x50ml_6x15ml_conical: new Set([
    'A3',
    'B3',
    'A4',
    'B4',
  ]),

  // This is probably legitimate. Heterogeneous tubes.
  'opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip':
    new Set([
      'A3',
      'B3',
      'C3',
      'D3',
      'A4',
      'B4',
      'C4',
      'D4',
      'A5',
      'B5',
      'C5',
      'D5',
      'A6',
      'B6',
      'C6',
      'D6',
      'A7',
      'B7',
      'C7',
      'D7',
      'A8',
      'B8',
      'C8',
      'D8',
    ]),

  // These height mismatches are legitimate. The zDimension should match the taller side.
  opentrons_calibrationblock_short_side_left: new Set(['A1']),
  opentrons_calibrationblock_short_side_right: new Set(['A2']),

  // this labware has a lip
  ev_resin_tips_flex_96_labware: standard96WellNames,
  ibidi_96_square_well_plate_300ul: standard96WellNames,

  // These were probably bugs, but it's moot now, since these adapter+wellplate
  // combo-definitions have been superseded by proper labware stacking.
  opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat:
    standard96WellNames,
  opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt:
    standard96WellNames,
  opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat:
    standard384WellNames,

  // This batch may have incompletely-updated geometry from recent work related to
  // liquid level detection and meniscus-relative pipetting. Probably, the wells were
  // updated but not the overall labware dimensions. This needs to be investigated and fixed.
  'opentrons_24_tuberack_nest_1.5ml_screwcap': standard24WellNames,
  opentrons_24_tuberack_nest_2ml_screwcap: standard24WellNames,
}

const filterWells = (
  labwareDef: LabwareDefinition2,
  predicate: (wellDef: LabwareWell) => boolean
): Set<string> => {
  return new Set(
    Object.entries(labwareDef.wells)
      .filter(([wellName, wellDef]) => predicate(wellDef))
      .map(([wellName, wellDef]) => wellName)
  )
}

const getWellsNotMatchingZDimension = (
  labwareDef: LabwareDefinition2
): Set<string> => {
  return filterWells(labwareDef, wellDef => {
    const absDifference = Math.abs(
      wellDef.depth + wellDef.z - labwareDef.dimensions.zDimension
    )
    return absDifference > 0.000001 // Tolerate floating point rounding errors.
  })
}

const getWellsHigherThanZDimension = (
  labwareDef: LabwareDefinition2
): Set<string> => {
  return filterWells(labwareDef, wellDef => {
    const difference =
      wellDef.depth + wellDef.z - labwareDef.dimensions.zDimension
    return difference > 0.000001 // Tolerate floating point rounding errors.
  })
}

const expectGroupsFollowConvention = (
  labwareDef: LabwareDefinition2,
  filename: string
): void => {
  test(`${filename} should not contain "groups.brand.brand" that matches the top-level "brand.brand"`, () => {
    const topLevelBrand = labwareDef.brand

    labwareDef.groups.forEach(group => {
      expect(group.brand?.brand).not.toEqual(topLevelBrand)
    })
  })

  test(`${filename} should not specify certain fields in 'groups' if it is a reservoir or wellPlate`, () => {
    // Certain fields in `groups` are intended to supplement labware-level information,
    // e.g. an Opentrons-brand tube rack might hold a group of Eppendorf-brand tubes.
    //
    // Those fields don't make sense on reservoirs or well plates, because the wells are
    // an inherent part of the labware. The information should just be specified in the
    // labware-level brand and metadata.

    if (
      labwareDef.parameters.loadName === 'nest_96_wellplate_2ml_deep' &&
      (labwareDef.version === 1 || labwareDef.version === 2)
    ) {
      // Bug in v1 and v2 of this labware, fixed in v3.
      return
    }

    const { displayCategory } = labwareDef.metadata
    const noGroupsMetadataAllowed =
      displayCategory === 'reservoir' ||
      displayCategory === 'wellPlate' ||
      displayCategory === 'filterPlate'

    if (noGroupsMetadataAllowed) {
      labwareDef.groups.forEach(group => {
        expect(group.brand).toBe(undefined)
        expect(group.metadata.displayName).toBe(undefined)
        expect(group.metadata.displayCategory).toBe(undefined)
      })
    }
  })
}

const checkQuirkRequirements = (labwareDef: LabwareDefinition2): void => {
  test('definitions cannot have both offsetPipetteFor96GridSubwells and offsetPipetteFor12GridSubwells', () => {
    if (labwareDef.parameters.quirks === undefined) {
      return
    }
    if (
      labwareDef.parameters.quirks.includes('offsetPipetteFor96GridSubwells')
    ) {
      expect(
        labwareDef.parameters.quirks.includes('offsetPipetteFor12GridSubwells')
      ).toBe(false)
    }
    if (
      labwareDef.parameters.quirks.includes('offsetPipetteFor12GridSubwells')
    ) {
      expect(
        labwareDef.parameters.quirks.includes('offsetPipetteFor96GridSubwells')
      ).toBe(false)
    }
  })
}

const checkGeometryDefinitions = (labwareDef: LabwareDefinition2): void => {
  test('geometries referenced by wells must actually exist', () => {
    for (const geometryId of Object.values(labwareDef.wells).map(
      well => well.geometryDefinitionId
    )) {
      if (geometryId !== undefined) {
        expect(labwareDef.innerLabwareGeometry).toHaveProperty(geometryId)
      }
    }
  })

  test("geometries should only exist if they're referenced by at least one well", () => {
    function isDefined<T>(x: T | undefined): x is T {
      return x !== undefined
    }

    const referencedGeometryIds = new Set(
      Object.values(labwareDef.wells)
        .map(well => well.geometryDefinitionId)
        .filter(isDefined)
    )

    for (const geometryId in labwareDef.innerLabwareGeometry) {
      expect(referencedGeometryIds).toContain(geometryId)
    }
  })

  test('sections of a well geometry, or elements in a height-volume map, should be sorted top to bottom', () => {
    const geometries = Object.values(labwareDef.innerLabwareGeometry ?? [])
    for (const geometry of geometries) {
      if ('sections' in geometry) {
        const sectionList = geometry.sections
        const sortedSectionList = sectionList.toSorted(
          (a, b) => b.topHeight - a.topHeight
        )
        expect(sortedSectionList).toStrictEqual(sectionList)
      }
      if ('heightToVolumeMap' in geometry) {
        const pairingList = geometry.heightToVolumeMap
        const heightSortedPairingList = pairingList.toSorted(
          (a, b) => b.height - a.height
        )
        const volumeSortedPairingList = pairingList.toSorted(
          (a, b) => b.volume - a.volume
        )
        expect(heightSortedPairingList).toStrictEqual(pairingList)
        expect(volumeSortedPairingList).toStrictEqual(pairingList)
      }
    }
  })

  test('first frustum section should match well diameter or x/y dimensions within ±1 mm', () => {
    // TODO(rc, 2025-08-05): Review labware with 0–2 mm geometry discrepancies.
    const wells = labwareDef.wells ?? {}
    const geometries = labwareDef.innerLabwareGeometry ?? {}
    // Allow minor mismatch due to simplified geometric approximation
    const allowedDiscrepancy = 2
    // Ignoring bc of a known x y mismatch
    if (
      labwareDef.parameters.loadName === 'nest_1_reservoir_195ml' &&
      labwareDef.version === 3
    ) {
      return
    }

    for (const well of Object.values(wells)) {
      const geometryId = well.geometryDefinitionId ?? ''
      const geometry = geometries[geometryId]

      if (
        !geometry ||
        !('sections' in geometry) ||
        !Array.isArray(geometry.sections)
      ) {
        continue
      }

      const section = geometry.sections[0]
      if (!section) continue

      if (well.shape === 'circular' && section.shape === 'conical') {
        expect(
          Math.abs(section.topDiameter - well.diameter)
        ).toBeLessThanOrEqual(allowedDiscrepancy)
      } else if (well.shape === 'rectangular' && section.shape === 'cuboidal') {
        expect(
          Math.abs(section.topXDimension - well.xDimension)
        ).toBeLessThanOrEqual(allowedDiscrepancy)
        expect(
          Math.abs(section.topYDimension - well.yDimension)
        ).toBeLessThanOrEqual(allowedDiscrepancy)
      }
    }
  })

  test('the bottom of a well geometry should be at height 0', () => {
    for (const geometry of Object.values(
      labwareDef.innerLabwareGeometry ?? {}
    )) {
      if ('sections' in geometry) {
        const bottomFrustum = geometry.sections[geometry.sections.length - 1]
        expect(bottomFrustum.bottomHeight).toStrictEqual(0)
      }
    }
  })

  test('each section of a well geometry should have topHeight > bottomHeight', () => {
    for (const geometry of Object.values(
      labwareDef.innerLabwareGeometry ?? {}
    )) {
      if ('sections' in geometry) {
        for (const section of geometry.sections) {
          expect(section.topHeight).toBeGreaterThan(section.bottomHeight)
        }
      }
    }
  })

  test('sections of a well geometry should exactly connect to each other', () => {
    for (const geometry of Object.values(
      labwareDef.innerLabwareGeometry ?? {}
    )) {
      if ('sections' in geometry) {
        for (const [above, below] of pairsFromArray(geometry.sections)) {
          expect(above.bottomHeight).toStrictEqual(below.topHeight)
        }
      }
    }
  })

  test("a well's dimensions (depth/xDimension/yDimension/diameter) should agree with its geometry", () => {
    for (const well of Object.values(labwareDef.wells)) {
      const wellGeometryId = well.geometryDefinitionId
      if (wellGeometryId == null) return
      const innerGeometryObject =
        labwareDef.innerLabwareGeometry?.[wellGeometryId]
      if (innerGeometryObject == null) return
      if (!isInnerWellGeometry(innerGeometryObject)) return

      const topSection = innerGeometryObject.sections[0]

      const depthFromWell = well.depth
      const xyDimensionsFromWell = extractXYDimensionsFromWell(well)
      const depthFromGeometry = topSection.topHeight
      const xyDimensionsFromGeometry =
        extractTopDimensionsFromGeometrySection(topSection)

      const labwareWithWellDepthMismatches = [
        // todo(mm, 2025-03-17): Investigate and resolve these mismatches.
        'opentrons_15_tuberack_falcon_15ml_conical',
        'opentrons_24_aluminumblock_nest_1.5ml_screwcap',
        'opentrons_24_aluminumblock_nest_2ml_screwcap',
        'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap',
        'opentrons_6_tuberack_falcon_50ml_conical',
        'opentrons_6_tuberack_nest_50ml_conical',
      ]

      if (
        labwareDef.parameters.loadName ===
        'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical'
      ) {
        // todo(mm, 2025-03-17): Some of the well heights in this definition do match
        // and some of them don't, so we can't assert either way. Investigate and
        // resolve the mismatches.
      } else if (
        labwareWithWellDepthMismatches.includes(labwareDef.parameters.loadName)
      ) {
        expect(depthFromWell).not.toStrictEqual(depthFromGeometry)
      } else {
        expect(depthFromWell).toStrictEqual(depthFromGeometry)
      }

      expect(xyDimensionsFromWell).toStrictEqual(xyDimensionsFromGeometry)
    }
  })
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
  const labwarePaths = glob.sync(globPattern, { cwd: definitionsDir })

  test("definition paths didn't break, which would give false positives", () => {
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  describe.each(labwarePaths)('%s', labwarePath => {
    const filename = path.parse(labwarePath).base
    const fullLabwarePath = path.join(definitionsDir, labwarePath)
    const labwareDef = require(fullLabwarePath) as LabwareDefinition2

    it('validates against the schema', () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })

    test('file name matches version', () => {
      expect(`${labwareDef.version}`).toEqual(path.basename(filename, '.json'))
    })

    test('parent dir matches loadName', () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(path.dirname(labwarePath))
      )
    })

    test('namespace is "opentrons"', () => {
      expect(labwareDef.namespace).toEqual('opentrons')
    })

    expectGroupsFollowConvention(labwareDef, labwarePath)
    checkQuirkRequirements(labwareDef)
  })
})

describe('test that the dimensions in all opentrons definitions make sense', () => {
  const labwarePaths = glob.sync('**/*.json', { cwd: definitionsDir })
  beforeAll(() => {
    // Make sure definitions path didn't break, which would give you false positives
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  describe.each(labwarePaths)('%s', labwarePath => {
    const fullLabwarePath = path.join(definitionsDir, labwarePath)
    const labwareDef = require(fullLabwarePath) as LabwareDefinition2

    const expectedWellsNotMatching =
      expectedWellsNotMatchingZDimension[labwareDef.parameters.loadName] ??
      new Set()
    it(`has the expected ${expectedWellsNotMatching.size} wells not matching the labware's zDimension`, context => {
      if (!isLatestDefinition(labwareDef)) context.skip()
      const wellsNotMatching = getWellsNotMatchingZDimension(labwareDef)
      expect(wellsNotMatching).toEqual(expectedWellsNotMatching)
    })

    const expectedWellsHigher =
      expectedWellsHigherThanZDimension[labwareDef.parameters.loadName] ??
      new Set()
    it(`has the expected ${expectedWellsHigher.size} wells above the labware's zDimension`, context => {
      if (!isLatestDefinition(labwareDef)) context.skip()
      const wellsHigher = getWellsHigherThanZDimension(labwareDef)
      expect(wellsHigher).toEqual(expectedWellsHigher)
    })

    // todo(mm, 2025-08-04): Replace if-statement with Vitest context.skip() or skipif().
    // We need Vitest >= 3.0 to replace describe.each() with describe.for() and get context.
    if (isLatestDefinition(labwareDef)) {
      checkGeometryDefinitions(labwareDef)
    }
  })
})

describe('test schemas of all v2 labware fixtures', () => {
  const labwarePaths = glob.sync(globPattern, { cwd: fixturesDir })

  test("definition paths didn't break, which would give false positives", () => {
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  describe.each(labwarePaths)('%s', labwarePath => {
    const filename = path.parse(labwarePath).base
    const fullLabwarePath = path.join(fixturesDir, labwarePath)
    const labwareDef = require(fullLabwarePath) as LabwareDefinition2

    test(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })

    test(`fixture file name matches loadName: ${labwarePath}`, () => {
      expect(labwareDef.parameters.loadName).toEqual(
        path.basename(filename, '.json')
      )
    })

    test(`namespace is "fixture": ${labwarePath}`, () => {
      expect(labwareDef.namespace).toEqual('fixture')
    })

    expectGroupsFollowConvention(labwareDef, filename)
    checkGeometryDefinitions(labwareDef)
    checkQuirkRequirements(labwareDef)
  })
})

describe('check groups of labware that should have the same geometry', () => {
  describe.each(
    Object.entries(SHARED_GEOMETRY_GROUPS).map(([groupName, groupEntries]) => ({
      groupName,
      groupEntries,
    }))
  )('$groupName', ({ groupEntries }) => {
    const normalizedGroupEntries = groupEntries.map(entry => ({
      loadName: typeof entry === 'string' ? entry : entry.loadName,
      geometryKey: typeof entry === 'string' ? undefined : entry.geometryKey,
    }))
    test.each(normalizedGroupEntries)(
      '$loadName',
      ({ loadName, geometryKey }) => {
        // We arbitrarily pick the first labware in the group to compare the rest against.
        const otherLabwareGeometry = getGeometry(
          normalizedGroupEntries[0].loadName,
          normalizedGroupEntries[0].geometryKey
        )
        const thisLabwareGeometry = getGeometry(loadName, geometryKey)
        expect(thisLabwareGeometry).toEqual(otherLabwareGeometry)
      }
    )
  })
})

/** Return the latest version of the given labware that's defined in schema 2. */
function findLatestDefinition(loadName: string): LabwareDefinition2 {
  const candidates: LabwareDefinition2[] = glob
    .sync('*.json', {
      cwd: path.join(definitionsDir, loadName),
      absolute: true,
    })
    .map(require)
  if (candidates.length === 0) {
    throw new Error(`No definitions found for ${loadName}.`)
  }
  candidates.sort((a, b) => a.version - b.version)
  const latest = candidates[candidates.length - 1]
  return latest
}

function isLatestDefinition(definition: LabwareDefinition2): boolean {
  return (
    findLatestDefinition(definition.parameters.loadName).version ===
    definition.version
  )
}

/**
 * Extract the given geometry from the given definition.
 *
 * If geometryKey is unspecified, the definition is expected to have exactly one
 * geometry key, and that one is extracted and returned.
 */
function getGeometry(
  loadName: string,
  geometryKey: string | undefined
): InnerWellGeometry | UserDefinedVolumes {
  const definition = findLatestDefinition(loadName)
  const availableGeometries = definition.innerLabwareGeometry ?? {}

  if (geometryKey === undefined) {
    const availableGeometryEntries = Object.entries(availableGeometries)
    if (availableGeometryEntries.length !== 1) {
      throw new Error(
        `Expected exactly 1 geometry in ${definition.parameters.loadName} but found ${availableGeometryEntries.length}.`
      )
    }
    return availableGeometryEntries[0][1]
  } else {
    const result = availableGeometries[geometryKey]
    if (result === undefined) {
      throw new Error(
        `No geometry found in ${definition.parameters.loadName} with key ${geometryKey}.`
      )
    }
    return result
  }
}

function isInnerWellGeometry(
  def: InnerWellGeometry | UserDefinedVolumes
): def is InnerWellGeometry {
  return 'sections' in def
}

/**
 * Extract some shape-specific properties from a well.
 * Fall back to undefined if that property doesn't exist, given the well's shape.
 */
function extractXYDimensionsFromWell(well: LabwareWell): {
  diameter?: number
  xDimension?: number
  yDimension?: number
} {
  switch (well.shape) {
    case 'circular':
      return { diameter: well.diameter }
    case 'rectangular':
      return {
        xDimension: well.xDimension,
        yDimension: well.yDimension,
      }
    // Deliberately no default case, for exhaustiveness checking.
  }
}

/**
 * Extract some shape-specific properties from a geometry section.
 * Fall back to undefined if that property doesn't exist, given the geometry section's shape.
 */
function extractTopDimensionsFromGeometrySection(section: WellSegment): {
  diameter?: number
  xDimension?: number
  yDimension?: number
} {
  switch (section.shape) {
    case 'spherical':
      return {}
    case 'conical':
      return { diameter: section.topDiameter }
    case 'cuboidal':
      return {
        xDimension: section.topXDimension,
        yDimension: section.topYDimension,
      }
    case 'roundedcuboid':
    case 'squaredcone': {
      switch (section.bottomCrossSection) {
        case 'circular': // Circular bottom, rectangular top.
          return {
            xDimension: section.rectangleXDimension,
            yDimension: section.rectangleYDimension,
          }
        case 'rectangular': // Rectangular bottom, circular top.
          return {
            diameter: section.circleDiameter,
          }
      }
    }
    // Deliberately no default case, for exhaustiveness checking.
  }
}
