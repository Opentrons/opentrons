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
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return 2 when there is two offset records with different labware', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
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
        definitionUri: 'some_definitionUri',
        location: { slotName: '1' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
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
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
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
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(0)
  })
  it('should not count offset to the trash', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        definitionUri: 'fixedTrash',
        location: { slotName: '12' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        definitionUri: 'some_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(1)
  })
  it('should return only new offsets when the pervious entries were identity offsts', () => {
    const labwareOffsets: LabwareOffset[] = [
      {
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        definitionUri: 'some_definitionUri',
        location: { slotName: '3' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        definitionUri: 'another_definitionUri',
        location: { moduleId: 'some_module' },
        vector: { x: 1, y: 0, z: 0 },
      },
    ]
    expect(getLatestLabwareOffsetCount(labwareOffsets)).toBe(2)
  })
})
