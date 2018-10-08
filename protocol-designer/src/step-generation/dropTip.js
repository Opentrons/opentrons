// @flow
import type {CommandCreator, RobotState} from './'
import {FIXED_TRASH_ID} from '../constants'
import cloneDeep from 'lodash/cloneDeep'
import updateLiquidState from './dispenseUpdateLiquidState'

const dropTip = (pipetteId: string): CommandCreator => (prevRobotState: RobotState) => {
  // No-op if there is no tip
  if (prevRobotState.tipState.pipettes[pipetteId] === false) {
    return {
      robotState: prevRobotState,
      commands: [],
    }
  }

  const nextRobotState: RobotState = cloneDeep(prevRobotState)

  nextRobotState.tipState.pipettes[pipetteId] = false

  const commands = [
    {
      command: 'drop-tip',
      params: {
        pipette: pipetteId,
        labware: FIXED_TRASH_ID,
        well: 'A1', // TODO: Is 'A1' of the trash always the right place to drop tips?
      },
    },
  ]

  return {
    commands,
    robotState: {
      ...nextRobotState,
      liquidState: updateLiquidState({
        pipetteId: pipetteId,
        pipetteData: prevRobotState.instruments[pipetteId],
        labwareId: FIXED_TRASH_ID,
        labwareType: 'fixed-trash',
        volume: prevRobotState.instruments[pipetteId].maxVolume, // update liquid state as if it was a dispense, but with max volume of pipette
        well: 'A1',
      }, prevRobotState.liquidState),
    },
  }
}

export default dropTip
