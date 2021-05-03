// @flow
import { _stripNoOpMixCommands } from '../utils/stripNoOpCommands'

describe('_stripNoOpMixCommands', () => {
  it('should remove pairs of aspirate+dispense commands when they result in no liquid changes', () => {
    const commands = [
      {
        command: 'aspirate',
        params: {
          pipette: 'pipetteId',
          volume: 3,
          labware: 'labwareId',
          well: 'A1',
          offsetFromBottomMm: 1,
          flowRate: 3.75,
        },
      },
      {
        command: 'dispense',
        params: {
          pipette: 'pipetteId',
          volume: 3,
          labware: 'labwareId',
          well: 'A1',
          //   NOTE: offsetFromBottomMm and flowRate can differ
          offsetFromBottomMm: 1.5,
          flowRate: 2.5,
        },
      },
    ]
    const result = _stripNoOpMixCommands(commands)
    expect(result).toEqual([])
  })

  it('should NOT remove pairs of aspirate+dispense commands when they result in liquid changes', () => {
    const commands = [
      {
        command: 'aspirate',
        params: {
          pipette: 'pipetteId',
          volume: 3,
          labware: 'labwareId',
          well: 'A1',
          offsetFromBottomMm: 1,
          flowRate: 3.75,
        },
      },
      {
        command: 'dispense',
        params: {
          pipette: 'pipetteId',
          // dispense different volume than aspirate
          volume: 4,
          labware: 'labwareId',
          well: 'A1',
          offsetFromBottomMm: 1,
          flowRate: 3.75,
        },
      },
    ]
    const result = _stripNoOpMixCommands(commands)
    expect(result).toEqual(commands)
  })
})
