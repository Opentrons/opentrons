import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHeightOfLabwareStackFromDefinitions } from '../getFlexStackerHardwareProps'
import { getMergedDivergingStacks } from '../getMergedDivergingStacks'

import type { LabwareDefinition, LabwareDefinition2 } from '../../types'
import type {
  LabwareInStack,
  ModuleInStack,
} from '../getStackedItemsOnStartingDeck'

vi.mock('../getFlexStackerHardwareProps')

// Height mock: sum of zDimensions (no overlaps), matching the user's stated
// assumption for all tests below.
beforeEach(() => {
  vi.mocked(getHeightOfLabwareStackFromDefinitions).mockImplementation(defs =>
    defs.reduce(
      (sum, def) => sum + (def as LabwareDefinition2).dimensions.zDimension,
      0
    )
  )
})

// helper to build labware of different heights
const makeDef = (loadName: string, zDimension: number): LabwareDefinition =>
  ({
    schemaVersion: 2,
    version: 1,
    namespace: 'test',
    metadata: {
      displayName: loadName,
      displayCategory: 'wellPlate',
      displayVolumeUnits: 'mL',
    },
    dimensions: { xDimension: 0, yDimension: 0, zDimension },
    stackingOffsetWithLabware: {
      default: { x: 0, y: 0, z: 0 },
    },
    parameters: {
      loadName,
      format: 'mock',
      isTiprack: false,
      isMagneticModuleCompatible: false,
    },
    cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
    brand: { brand: 'test' },
    ordering: [],
    wells: {},
    groups: [],
  }) as LabwareDefinition

const makeLabware = (labwareId: string, defUri: string): LabwareInStack => ({
  labwareId,
  definitionUri: defUri,
  displayName: labwareId,
})

const MODULE: ModuleInStack = {
  moduleId: 'module-1',
  moduleModel: 'vacuumModuleV1',
  moduleSlotName: 'A3',
}

// Definitions referenced by URI in the labwareDefinitions map
const COLLAR_DEF = makeDef('collar', 40)
const PLATE1_DEF = makeDef('plate1', 20)
const PLATE2_DEF = makeDef('plate2', 25)
const PLATE3_DEF = makeDef('plate3', 25)
const NESTED_PLATE_DEF = makeDef('nested_plate', 5) // nests inside collar

const DEFS: { [uri: string]: LabwareDefinition } = {
  'test/collar/1': COLLAR_DEF,
  'test/plate1/1': PLATE1_DEF,
  'test/plate2/1': PLATE2_DEF,
  'test/plate3/1': PLATE3_DEF,
  'test/nested_plate/1': NESTED_PLATE_DEF,
}

const collar = makeLabware('collar-id', 'test/collar/1')
const plate1 = makeLabware('plate1-id', 'test/plate1/1')
const plate2 = makeLabware('plate2-id', 'test/plate2/1')
const plate3 = makeLabware('plate3-id', 'test/plate3/1')
const nestedPlate = makeLabware('nested-plate-id', 'test/nested_plate/1')

describe('getMergedDivergingStacks', () => {
  it('returns empty array for empty input', () => {
    expect(getMergedDivergingStacks([], DEFS)).toEqual([])
  })

  it('returns a single stack in top-to-bottom order', () => {
    const stack = [plate1, collar, MODULE]
    const result = getMergedDivergingStacks([stack], DEFS)
    expect(
      result.map(i => ('labwareId' in i ? i.labwareId : i.moduleId))
    ).toEqual(['plate1-id', 'collar-id', 'module-1'])
  })

  it('folds two diverging stacks: depth-2 items before depth-1, height as tiebreaker', () => {
    // "bridge shuffle"
    const stack1 = [plate1, collar, MODULE]
    const stack2 = [plate3, plate2, MODULE]

    const result = getMergedDivergingStacks([stack1, stack2], DEFS)

    expect(
      result.map(i => ('labwareId' in i ? i.labwareId : i.moduleId))
    ).toEqual(['plate1-id', 'plate3-id', 'collar-id', 'plate2-id', 'module-1'])
  })

  it('places a nested labware before its parent even when its absolute height is lower', () => {
    vi.mocked(getHeightOfLabwareStackFromDefinitions).mockImplementation(
      defs => {
        if (defs.length === 1) {
          return (defs[0] as LabwareDefinition2).dimensions.zDimension
        }
        // explicitly simulate nestedPlate recessing 20mm into collar
        return 25
      }
    )

    const stack = [nestedPlate, collar, MODULE]
    const result = getMergedDivergingStacks([stack], DEFS)

    expect(
      result.map(i => ('labwareId' in i ? i.labwareId : i.moduleId))
    ).toEqual([
      'nested-plate-id', // depth 2, comes first despite lower absolute height
      'collar-id', // depth 1
      'module-1',
    ])
  })

  it('deduplicates items across stacks, keeping the entry with the greatest depth', () => {
    // Note that this case should never happen in practice
    const stack1 = [plate1, collar, MODULE]
    const stack2 = [collar, MODULE]

    const result = getMergedDivergingStacks([stack1, stack2], DEFS)

    const ids = result.map(i => ('labwareId' in i ? i.labwareId : i.moduleId))
    const collarCount = ids.filter(id => id === 'collar-id').length
    expect(collarCount).toBe(1)
    expect(ids).toEqual(['plate1-id', 'collar-id', 'module-1'])
  })

  it('appends the shared parent as the last element', () => {
    const stack1 = [plate1, collar, MODULE]
    const stack2 = [plate2, MODULE]

    const result = getMergedDivergingStacks([stack1, stack2], DEFS)

    const last = result[result.length - 1]
    expect('moduleId' in last && last.moduleId).toBe('module-1')
  })

  it('handles non-uniform bridge shuffles', () => {
    const stack1 = [nestedPlate, plate1, MODULE]
    const stack2 = [plate3, collar, MODULE]

    const result = getMergedDivergingStacks([stack1, stack2], DEFS)

    expect(
      result.map(i => ('labwareId' in i ? i.labwareId : i.moduleId))
    ).toEqual([
      'plate3-id',
      'collar-id',
      'nested-plate-id',
      'plate1-id',
      'module-1',
    ])
  })
})
