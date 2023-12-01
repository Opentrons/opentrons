import { forDropTip as _forDropTip } from '../getNextRobotStateAndWarnings/forDropTip'
describe('dropTip', () => {
  //  NOTE(jr, 12/1/23): this state update is not in use currently for PD 8.0
  //  since we only support dropping tip into the waste chute or trash bin
  //  which are both addressableAreas (so the commands are moveToAddressableArea
  //  and dropTipInPlace) We will use this again when we add return tip.
  describe('replaceTip: single channel', () => {
    it.todo('drop tip if there is a tip')
    it.todo('no tip on pipette')
  })
  describe('Multi-channel dropTip', () => {
    it.todo('drop tip when there are tips')
  })
  describe('liquid tracking', () => {
    it.todo('dropTip uses full volume when transfering tip to trash')
  })
})
