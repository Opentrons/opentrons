// @flow
import type {CommandCreator, RobotState} from './'
import cloneDeep from 'lodash/cloneDeep'
import updateLiquidState from './dispenseUpdateLiquidState'

const dropTip = (pipetteId: string): CommandCreator => (prevRobotState: RobotState) => {
  // No-op if there is no tip
  if (prevRobotState.tipState.pipettes[pipetteId] === false) {
    return {
      robotState: prevRobotState,
      commands: []
    }
  }

  const trashId = 'trashId'

  const nextRobotState: RobotState = cloneDeep(prevRobotState)

  nextRobotState.tipState.pipettes[pipetteId] = false

  const commands = [
    {
      command: 'drop-tip',
      pipette: pipetteId,
      labware: trashId, // TODO Ian 2018-02-09 will we always have this trash in robotState? If so, put the ID in constants (or cooked into RobotState type itself).
      well: 'A1' // TODO: Is 'A1' of the trash always the right place to drop tips?
    }
  ]

  return {
    commands,
    robotState: {
      ...nextRobotState,
      liquidState: updateLiquidState({
        pipetteId: pipetteId,
        pipetteData: prevRobotState.instruments[pipetteId],
        labwareId: trashId,
        labwareType: 'fixed-trash',
        volume: prevRobotState.instruments[pipetteId].maxVolume, // update liquid state as if it was a dispense, but with max volume of pipette
        well: 'A1'
      }, prevRobotState.liquidState)
    }
  }
}

export default dropTip
