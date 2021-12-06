import { LabwareOffset } from '@opentrons/api-client'
import { getLatestLabwareOffsetCount } from '../getLatestLabwareOffsetCount'
describe('getLatestLabwareOffsetCount', () => {
  it('should return 0 when there are no offests', () => {
    const labwareOffsets: LabwareOffset[] = []

    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(0)
  })

  it('should return 1 when there is one offset record', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return 2 when there are two offset records with different labware', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID1',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'someID2',
        createdAt: '2021-11-29',
        definitionUri: 'another_definitionUri',
        location: { slotName: '2' },
        vector: { x: 1, y: 2, z: 3 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(2)
  })
  it('should return 1 when there are two offset records with the same labware and slot', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID1',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'someID2',
        createdAt: '2021-11-30',
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 2, z: 3 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return 1 when there are two offset records with the same labware and module id', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID1',
        createdAt: '2021-11-30',
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'someID2',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 2, z: 3 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return 0 when all offsets are identity offsets', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID1',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someID2',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(0)
  })
  it('should not count offsets to the trash', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someID1',
        createdAt: '2021-11-29',
        definitionUri: 'fixedTrash',
        location: { slotName: '12' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someID2',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return only new offsets when the previous entries were identity offsets', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someId1',
        createdAt: '2021-11-29',
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someId2',
        createdAt: '2021-11-30',
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'someId3',
        createdAt: '2021-11-29',
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someId4',
        createdAt: '2021-11-30',
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(2)
  })
  it('should return only zero offsets when the newest entries are identity offsets', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        id: 'someId1',
        createdAt: '2021-12-29',
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someId2',
        createdAt: '2021-11-30',
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'someId3',
        createdAt: '2021-12-29',
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'someId4',
        createdAt: '2021-11-30',
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(0)
  })
})
