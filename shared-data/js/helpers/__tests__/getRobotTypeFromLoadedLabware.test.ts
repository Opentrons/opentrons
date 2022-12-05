import { getRobotTypeFromLoadedLabware } from '..'
import type { LoadedLabware } from '../..'

describe('getRobotTypeFromLoadedLabware', () => {
  it('should return an OT-2 when an OT-2 trash is loaded into the protocol', () => {
    const labware: LoadedLabware[] = [
      {
        id: 'fixedTrash',
        loadName: 'opentrons_1_trash_1100ml_fixed',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        location: {
          slotName: '12',
        },
      },
    ]
    expect(getRobotTypeFromLoadedLabware(labware)).toBe('OT-2 Standard')
  })
  it('should return an OT-3 when an OT-3 trash is loaded into the protocol', () => {
    const labware: LoadedLabware[] = [
      {
        id: 'fixedTrash',
        loadName: 'opentrons_1_trash_3200ml_fixed',
        definitionUri: 'opentrons/opentrons_1_trash_3200ml_fixed/1',
        location: {
          slotName: '12',
        },
      },
    ]
    expect(getRobotTypeFromLoadedLabware(labware)).toBe('OT-3 Standard')
  })
})
