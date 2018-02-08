import {
  generateCommands
  // generateSubsteps
} from '../generateSubsteps'

describe('generateCommands', () => {
  test('commands for minimal transfer step', () => {
    const data = {
      stepType: 'transfer',
      pipette: 'left',
      'sourceWells': ['A1', 'A2'],
      'sourceLabware': 'sourcePlateId',
      volume: 20,
      'destLabware': 'destPlateId',
      'destWells': ['B1', 'B2']
    }
    expect(generateCommands(data)).toEqual([
      {
        commandType: 'aspirate',
        volume: 20,
        pipette: 'left',
        labware: 'sourcePlateId',
        well: 'A1'
      },
      {
        commandType: 'dispense',
        volume: 20,
        pipette: 'left',
        labware: 'destPlateId',
        well: 'B1'
      },

      {
        commandType: 'aspirate',
        volume: 20,
        pipette: 'left',
        labware: 'sourcePlateId',
        well: 'A2'
      },
      {
        commandType: 'dispense',
        volume: 20,
        pipette: 'left',
        labware: 'destPlateId',
        well: 'B2'
      }
    ])
  })
})
