import { describe, expect, it } from 'vitest'

import { ANY_LOCATION } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { getRelevantOffsets } from '../utils'

import type { LabwareOffset, StoredLabwareOffset } from '@opentrons/api-client'

describe('utils', () => {
  describe('getRelevantOffsets', () => {
    const LABWARE_URI = 'labware-1'
    const VECTOR = { x: 1, y: 2, z: 3 }
    const SLOT_NAME = 'A1'

    const OT2_OFFSETS: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI,
        location: { slotName: SLOT_NAME },
        vector: VECTOR,
      },
      {
        id: 'offset-2',
        createdAt: '2023-01-02T00:00:00Z',
        definitionUri: LABWARE_URI,
        location: { slotName: 'B1' },
        vector: { x: 4, y: 5, z: 6 },
      },
    ] as LabwareOffset[]

    const FLEX_OFFSETS: StoredLabwareOffset[] = [
      {
        id: 'stored-offset-1',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI,
        locationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: SLOT_NAME },
        ],
        vector: VECTOR,
      },
      {
        id: 'stored-offset-2',
        createdAt: '2023-01-02T00:00:00Z',
        definitionUri: LABWARE_URI,
        locationSequence: ANY_LOCATION,
        vector: { x: 4, y: 5, z: 6 },
      },
      {
        id: 'stored-offset-3',
        createdAt: '2023-01-03T00:00:00Z',
        definitionUri: LABWARE_URI,
        locationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: 'B1' },
        ],
        vector: { x: 7, y: 8, z: 9 },
      },
    ] as StoredLabwareOffset[]

    it('should return transformed OT2 offsets for OT2 robot type', () => {
      const result = getRelevantOffsets(
        OT2_ROBOT_TYPE,
        OT2_OFFSETS,
        FLEX_OFFSETS
      )

      expect(result).toEqual([
        {
          definitionUri: LABWARE_URI,
          location: { slotName: SLOT_NAME },
          vector: VECTOR,
        },
        {
          definitionUri: LABWARE_URI,
          location: { slotName: 'B1' },
          vector: { x: 4, y: 5, z: 6 },
        },
      ])
    })

    it('should return transformed Flex offsets without ANY_LOCATION offsets for Flex robot type', () => {
      const result = getRelevantOffsets(
        FLEX_ROBOT_TYPE,
        OT2_OFFSETS,
        FLEX_OFFSETS
      )

      expect(result).toEqual([
        {
          definitionUri: LABWARE_URI,
          locationSequence: [
            { kind: 'onAddressableArea', addressableAreaName: SLOT_NAME },
          ],
          vector: VECTOR,
        },
        {
          definitionUri: LABWARE_URI,
          locationSequence: [
            { kind: 'onAddressableArea', addressableAreaName: 'B1' },
          ],
          vector: { x: 7, y: 8, z: 9 },
        },
      ])
    })

    it('should handle empty OT2 offsets for OT2 robot type', () => {
      const result = getRelevantOffsets(OT2_ROBOT_TYPE, [], FLEX_OFFSETS)

      expect(result).toEqual([])
    })

    it('should handle empty Flex offsets for Flex robot type', () => {
      const result = getRelevantOffsets(FLEX_ROBOT_TYPE, OT2_OFFSETS, [])

      expect(result).toEqual([])
    })

    it('should handle Flex offsets with only ANY_LOCATION offsets for Flex robot type', () => {
      const onlyDefaultOffsets: StoredLabwareOffset[] = [
        {
          id: 'stored-offset-2',
          createdAt: '2023-01-02T00:00:00Z',
          definitionUri: LABWARE_URI,
          locationSequence: ANY_LOCATION,
          vector: { x: 4, y: 5, z: 6 },
        },
      ] as StoredLabwareOffset[]

      const result = getRelevantOffsets(
        FLEX_ROBOT_TYPE,
        OT2_OFFSETS,
        onlyDefaultOffsets
      )

      expect(result).toEqual([])
    })
  })
})
