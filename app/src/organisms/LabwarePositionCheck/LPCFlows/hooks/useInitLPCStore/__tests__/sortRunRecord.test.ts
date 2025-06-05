import { describe, expect, it } from 'vitest'

import { sortRunRecordOffsets } from '../sortRunRecordOffsets'

import type { LabwareOffset } from '@opentrons/api-client'

describe('sortRunRecordOffsets', () => {
  const LABWARE_URI_1 = 'opentrons/labware-1'
  const LABWARE_URI_2 = 'opentrons/labware-2'
  const LOCATION_SEQUENCE_1 = [
    { kind: 'onAddressableArea', addressableAreaName: 'A1' },
  ]
  const LOCATION_SEQUENCE_2 = [
    { kind: 'onAddressableArea', addressableAreaName: 'B1' },
  ]

  it('should sort offsets by most recent first', () => {
    const mockOffsets: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2022-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 1, y: 2, z: 3 },
      },
      {
        id: 'offset-2',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A2' },
        locationSequence: LOCATION_SEQUENCE_2,
        vector: { x: 4, y: 5, z: 6 },
      },
    ] as any

    const result = sortRunRecordOffsets(mockOffsets)

    expect(result[0].id).toBe('offset-2')
    expect(result[1].id).toBe('offset-1')
  })

  it('should remove duplicates based on definitionUri and locationSequence', () => {
    const mockOffsets: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2022-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 1, y: 2, z: 3 },
      },
      {
        id: 'offset-2',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 4, y: 5, z: 6 },
      },
    ] as any

    const result = sortRunRecordOffsets(mockOffsets)

    expect(result.length).toBe(1)
    expect(result[0].id).toBe('offset-2')
  })

  it('should keep offsets with different definitionUri', () => {
    const mockOffsets: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2022-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 1, y: 2, z: 3 },
      },
      {
        id: 'offset-2',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_2,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 4, y: 5, z: 6 },
      },
    ] as any

    const result = sortRunRecordOffsets(mockOffsets)

    expect(result.length).toBe(2)
    expect(result[0].id).toBe('offset-2')
    expect(result[1].id).toBe('offset-1')
  })

  it('should keep offsets with different locationSequence', () => {
    const mockOffsets: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2022-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 1, y: 2, z: 3 },
      },
      {
        id: 'offset-2',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'B1' },
        locationSequence: LOCATION_SEQUENCE_2,
        vector: { x: 4, y: 5, z: 6 },
      },
    ] as any

    const result = sortRunRecordOffsets(mockOffsets)

    expect(result.length).toBe(2)
    expect(result[0].id).toBe('offset-2')
    expect(result[1].id).toBe('offset-1')
  })

  it('should handle empty array', () => {
    const result = sortRunRecordOffsets([])

    expect(result).toEqual([])
  })

  it('should handle single offset', () => {
    const mockOffset: LabwareOffset = {
      id: 'offset-1',
      createdAt: '2022-01-01T00:00:00Z',
      definitionUri: LABWARE_URI_1,
      location: { slotName: 'A1' },
      locationSequence: LOCATION_SEQUENCE_1,
      vector: { x: 1, y: 2, z: 3 },
    } as any

    const result = sortRunRecordOffsets([mockOffset])

    expect(result).toEqual([mockOffset])
  })

  it('should handle multiple duplicates', () => {
    const mockOffsets: LabwareOffset[] = [
      {
        id: 'offset-1',
        createdAt: '2021-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 1, y: 2, z: 3 },
      },
      {
        id: 'offset-2',
        createdAt: '2022-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 4, y: 5, z: 6 },
      },
      {
        id: 'offset-3',
        createdAt: '2023-01-01T00:00:00Z',
        definitionUri: LABWARE_URI_1,
        location: { slotName: 'A1' },
        locationSequence: LOCATION_SEQUENCE_1,
        vector: { x: 7, y: 8, z: 9 },
      },
    ] as any

    const result = sortRunRecordOffsets(mockOffsets)

    expect(result.length).toBe(1)
    expect(result[0].id).toBe('offset-3')
  })
})
