// @flow
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'

jest.mock('../getNextRobotStateAndWarnings/forAspirateDispense')

describe('Aspirate Command', () => {
  test('aspirate from single-ingredient well', () => {
    const params = 'fake params'
    const prevRobotState = 'fake robot state'
    const command = {command: 'aspirate', params}
    getNextRobotStateAndWarnings(command, prevRobotState)

    expect(forAspirateDispense).toHaveBeenCalledWith(command.params, prevRobotState)
  })
})
