// NOTE: flow not used bc timeline is phony and flow doesn't have def for resultFunc
import { getRobotStateTimelineWithoutAirGapDispenseCommand } from '../selectors/fileCreator'

describe('getRobotStateTimelineWithoutAirGapDispenseCommand', () => {
  it('should replace dispenseAirGap commands with dispenses', () => {
    const robotStateTimeline = {
      timeline: [
        {
          commands: [
            { commandType: 'pickUpTip', params: 'fakePickUpTipParams' },
            { commandType: 'aspirate', params: 'fakeAspirateParams' },
            {
              commandType: 'dispenseAirGap',
              params: 'fakeDispenseAirGapParams',
            },
            { commandType: 'dispense', params: 'fakeDispenseParams' },
          ],
          robotState: 'fakeRobotState1',
        },
        {
          commands: [
            { commandType: 'aspirate', params: 'fakeAspirateParams2' },
            {
              commandType: 'dispenseAirGap',
              params: 'fakeDispenseAirGapParams2',
            },
            { commandType: 'dispense', params: 'fakeDispenseParams2' },
            { commandType: 'dropTip', params: 'fakeDropTipParams' },
          ],
          robotState: 'fakeRobotState2',
        },
      ],
    }
    expect(
      // @ts-expect-error(sa, 2021-6-18): resultFunc not part of Selector type
      getRobotStateTimelineWithoutAirGapDispenseCommand.resultFunc(
        robotStateTimeline
      )
    ).toEqual({
      timeline: [
        {
          commands: [
            { commandType: 'pickUpTip', params: 'fakePickUpTipParams' },
            { commandType: 'aspirate', params: 'fakeAspirateParams' },
            { commandType: 'dispense', params: 'fakeDispenseAirGapParams' }, // changed command.command
            { commandType: 'dispense', params: 'fakeDispenseParams' },
          ],
          robotState: 'fakeRobotState1',
        },
        {
          commands: [
            { commandType: 'aspirate', params: 'fakeAspirateParams2' },
            { commandType: 'dispense', params: 'fakeDispenseAirGapParams2' }, // changed command.command
            { commandType: 'dispense', params: 'fakeDispenseParams2' },
            { commandType: 'dropTip', params: 'fakeDropTipParams' },
          ],
          robotState: 'fakeRobotState2',
        },
      ],
    })
  })
})
