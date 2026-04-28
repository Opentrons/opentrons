import { describe, expect, it } from 'vitest'

import {
  fixture96Plate,
  FLEX_ROBOT_TYPE,
  getCutoutIdFromAddressableArea,
  getDeckDefFromRobotType,
  getEmptyDeckConfiguration,
} from '@opentrons/shared-data'

import { ZERO_COORDINATE_TUPLE } from '../constants'
import {
  getLabwareStackRenderingInfo,
  getOffsetPosition,
  getRenderingPositionFromBaseNode,
} from '../labwareStackRendering'

import type {
  AddressableAreaName,
  DeckConfiguration,
  LoadedLabwareLocation,
} from '@opentrons/shared-data'
import type { LabwareEntities } from '@opentrons/step-generation'

const flexDeckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
const flexEmptyDeckConfiguration = getEmptyDeckConfiguration(flexDeckDef)

describe('getOffsetPosition', () => {
  it('adds offset components to position', () => {
    expect(
      getOffsetPosition({
        position: [1, 2, 3],
        offset: { x: 10, y: -5, z: 0.5 },
      })
    ).toEqual([11, -3, 3.5])
  })

  it('handles zero position', () => {
    expect(
      getOffsetPosition({
        position: [0, 0, 0],
        offset: { x: 0, y: 0, z: 0 },
      })
    ).toEqual([0, 0, 0])
  })
})

describe('getRenderingPositionFromBaseNode', () => {
  it('returns origin for non-slot / non-addressable-area base nodes', () => {
    const baseNodes: LoadedLabwareLocation[] = [
      'offDeck',
      'systemLocation',
      'wasteChuteLocation',
      { moduleId: 'mod1' },
      { labwareId: 'lw1' },
      { kind: 'inStackerHopper', moduleId: 'stacker1' },
    ]
    baseNodes.forEach(baseNode => {
      expect(
        getRenderingPositionFromBaseNode({
          baseNode,
          deckDef: flexDeckDef,
          deckConfiguration: flexEmptyDeckConfiguration,
        })
      ).toEqual(ZERO_COORDINATE_TUPLE)
    })
  })

  it('returns origin when the addressable area id is missing from the deck definition', () => {
    expect(
      getRenderingPositionFromBaseNode({
        baseNode: {
          addressableAreaName: 'badAA' as AddressableAreaName,
        },
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toEqual(ZERO_COORDINATE_TUPLE)
  })

  it('returns origin when deck configuration has no entry for the cutout', () => {
    expect(
      getRenderingPositionFromBaseNode({
        baseNode: { slotName: 'A1' },
        deckDef: flexDeckDef,
        deckConfiguration: [] as unknown as DeckConfiguration,
      })
    ).toEqual(ZERO_COORDINATE_TUPLE)
  })

  it('returns cutout position plus addressable area fixture offset for a slot base', () => {
    const slotName = 'A1' as AddressableAreaName
    const addressableArea = flexDeckDef.locations.addressableAreas.find(
      ({ id }) => id === slotName
    )
    expect(addressableArea).toBeDefined()
    const cutoutId = getCutoutIdFromAddressableArea(slotName, flexDeckDef)
    const cutout = flexDeckDef.locations.cutouts.find(
      ({ id }) => id === cutoutId
    )
    expect(cutout).toBeDefined()
    const expected = getOffsetPosition({
      position: cutout!.position,
      offset: {
        x: addressableArea!.offsetFromCutoutFixture[0],
        y: addressableArea!.offsetFromCutoutFixture[1],
        z: addressableArea!.offsetFromCutoutFixture[2],
      },
    })
    expect(
      getRenderingPositionFromBaseNode({
        baseNode: { slotName: 'A1' },
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toEqual(expected)
  })

  it('matches slot form when using addressableAreaName for the same slot', () => {
    const bySlot = getRenderingPositionFromBaseNode({
      baseNode: { slotName: 'B2' },
      deckDef: flexDeckDef,
      deckConfiguration: flexEmptyDeckConfiguration,
    })
    const byAa = getRenderingPositionFromBaseNode({
      baseNode: { addressableAreaName: 'B2' as AddressableAreaName },
      deckDef: flexDeckDef,
      deckConfiguration: flexEmptyDeckConfiguration,
    })
    expect(bySlot).toEqual(byAa)
  })
})

describe('getLabwareStackRenderingInfo', () => {
  const loadName = fixture96Plate.parameters.loadName
  const plateEntity = {
    id: 'plate_bottom',
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: fixture96Plate,
    pythonName: 'plate_bottom',
  }
  const plateTopDef = {
    ...fixture96Plate,
    stackingOffsetWithLabware: {
      [loadName]: { x: 1, y: -2, z: 4 },
    },
  }
  const plateTopEntity = {
    id: 'plate_top',
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: plateTopDef,
    pythonName: 'plate_top',
  }
  const labwareEntities = {
    [plateEntity.id]: plateEntity,
    [plateTopEntity.id]: plateTopEntity,
  } as LabwareEntities

  it('returns null for an empty stack', () => {
    expect(
      getLabwareStackRenderingInfo({
        stack: [],
        labwareEntities,
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toBeNull()
  })

  it('returns null when a labware id in the stack has no entity', () => {
    expect(
      getLabwareStackRenderingInfo({
        stack: [{ labwareId: 'missing' }, { slotName: 'A1' }],
        labwareEntities,
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toBeNull()
  })

  it('returns an empty array when the stack has no labware location objects', () => {
    expect(
      getLabwareStackRenderingInfo({
        stack: [{ slotName: 'A1' }],
        labwareEntities,
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toEqual([])
  })

  it('accumulates stacking offsets bottom to top (input stack is top-down)', () => {
    const basePos = getRenderingPositionFromBaseNode({
      baseNode: { slotName: 'A1' },
      deckDef: flexDeckDef,
      deckConfiguration: flexEmptyDeckConfiguration,
    })
    const afterOffset = getOffsetPosition({
      position: basePos,
      offset: { x: 1, y: -2, z: 4 },
    })
    const stackTopDown = [
      { labwareId: plateTopEntity.id },
      { labwareId: plateEntity.id },
      { slotName: 'A1' },
    ]
    expect(
      getLabwareStackRenderingInfo({
        stack: stackTopDown,
        labwareEntities,
        deckDef: flexDeckDef,
        deckConfiguration: flexEmptyDeckConfiguration,
      })
    ).toEqual([
      {
        labwareId: plateEntity.id,
        definition: plateEntity.def,
        position: basePos,
      },
      {
        labwareId: plateTopEntity.id,
        definition: plateTopEntity.def,
        position: afterOffset,
      },
    ])
  })

  it('does not mutate the input stack', () => {
    const stackTopDown = [
      { labwareId: plateTopEntity.id },
      { labwareId: plateEntity.id },
      { slotName: 'A1' },
    ]
    const copy = stackTopDown.map(n => ({ ...n }))
    getLabwareStackRenderingInfo({
      stack: stackTopDown,
      labwareEntities,
      deckDef: flexDeckDef,
      deckConfiguration: flexEmptyDeckConfiguration,
    })
    expect(stackTopDown).toEqual(copy)
  })
})
