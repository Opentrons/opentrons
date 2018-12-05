// @flow
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'
import {
  createRobotState,
  commandCreatorNoErrors,
} from './fixtures'

import _aspirate from '../commandCreators/atomic/aspirate'

const aspirate = commandCreatorNoErrors(_aspirate)

jest.mock('../getNextRobotStateAndWarnings/forAspirateDispense')

describe('Aspirate Command', () => {
  test('aspirate from single-ingredient well', () => {
    const prevRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillTiprackTips: true,
      fillPipetteTips: true,
      tipracks: [300, 300],
    })
    const args = {
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
      volume: 152,
    }
    const command = aspirate(args)(prevRobotState).commands[0]
    getNextRobotStateAndWarnings(command, prevRobotState)

    expect(forAspirateDispense).toHaveBeenCalledWith(command.params, prevRobotState)
  })
})
