import { _stripNoOpMixCommands } from '../utils/stripNoOpCommands'
import type { CreateCommand } from '@opentrons/shared-data'

describe('_stripNoOpMixCommands', () => {
  it('should remove pairs of aspirate+dispense commands when they result in no liquid changes', () => {
    const commands: CreateCommand[] = [
      {
        commandType: 'aspirate',
        params: {
          pipetteId: 'pipetteId',
          volume: 3,
          labwareId: 'labwareId',
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 1,
            },
          },
          flowRate: 3.75,
        },
      },
      {
        commandType: 'dispense',
        params: {
          pipetteId: 'pipetteId',
          volume: 3,
          labwareId: 'labwareId',
          wellName: 'A1',
          //   NOTE: offsetFromBottomMm and flowRate can differ
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 1.5,
            },
          },
          flowRate: 2.5,
        },
      },
    ]

    const result = _stripNoOpMixCommands(commands)

    expect(result).toEqual([])
  })
  it('should NOT remove pairs of aspirate+dispense commands when they result in liquid changes', () => {
    const commands: CreateCommand[] = [
      {
        commandType: 'aspirate',
        params: {
          pipetteId: 'pipetteId',
          volume: 3,
          labwareId: 'labwareId',
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 1,
            },
          },
          flowRate: 3.75,
        },
      },
      {
        commandType: 'dispense',
        params: {
          pipetteId: 'pipetteId',
          // dispense different volume than aspirate
          volume: 4,
          labwareId: 'labwareId',
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 1,
            },
          },
          flowRate: 3.75,
        },
      },
    ]

    const result = _stripNoOpMixCommands(commands)

    expect(result).toEqual(commands)
  })
})
