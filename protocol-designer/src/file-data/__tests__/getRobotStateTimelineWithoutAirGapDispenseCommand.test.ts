// NOTE: flow not used bc timeline is phony and flow doesn't have def for resultFunc
import { getRobotStateTimelineWithoutAirGapDispenseCommand } from '../selectors/fileCreator'

describe('getRobotStateTimelineWithoutAirGapDispenseCommand', () => {
  it('should replace dispenseAirGap commands with dispenses', () => {
    const robotStateTimeline = {
      timeline: [
        {
          commands: [
            { command: 'pickUpTip', params: 'fakePickUpTipParams' },
            { command: 'aspirate', params: 'fakeAspirateParams' },
            { command: 'dispenseAirGap', params: 'fakeDispenseAirGapParams' },
            { command: 'dispense', params: 'fakeDispenseParams' },
          ],
          robotState: 'fakeRobotState1',
        },
        {
          commands: [
            { command: 'aspirate', params: 'fakeAspirateParams2' },
            { command: 'dispenseAirGap', params: 'fakeDispenseAirGapParams2' },
            { command: 'dispense', params: 'fakeDispenseParams2' },
            { command: 'dropTip', params: 'fakeDropTipParams' },
          ],
          robotState: 'fakeRobotState2',
        },
      ],
    }
    expect(
      getRobotStateTimelineWithoutAirGapDispenseCommand.resultFunc(
        robotStateTimeline
      )
    ).toEqual({
      timeline: [
        {
          commands: [
            { command: 'pickUpTip', params: 'fakePickUpTipParams' },
            { command: 'aspirate', params: 'fakeAspirateParams' },
            { command: 'dispense', params: 'fakeDispenseAirGapParams' }, // changed command.command
            { command: 'dispense', params: 'fakeDispenseParams' },
          ],
          robotState: 'fakeRobotState1',
        },
        {
          commands: [
            { command: 'aspirate', params: 'fakeAspirateParams2' },
            { command: 'dispense', params: 'fakeDispenseAirGapParams2' }, // changed command.command
            { command: 'dispense', params: 'fakeDispenseParams2' },
            { command: 'dropTip', params: 'fakeDropTipParams' },
          ],
          robotState: 'fakeRobotState2',
        },
      ],
    })
  })
})
