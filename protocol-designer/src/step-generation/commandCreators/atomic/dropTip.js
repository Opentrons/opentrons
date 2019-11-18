// @flow
import cloneDeep from 'lodash/cloneDeep'
import { FIXED_TRASH_ID } from '../../../constants'
import type { RobotState, NextCommandCreator } from '../../types'

type DropTipArgs = {| pipette: string |}
/** Drop tip if given pipette has a tip. If it has no tip, do nothing. */
const dropTip: NextCommandCreator<DropTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipette]) {
    return {
      commands: [],
    }
  }

  const nextRobotState: RobotState = cloneDeep(prevRobotState)

  nextRobotState.tipState.pipettes[pipette] = false

  const commands = [
    {
      command: 'dropTip',
      params: {
        pipette,
        labware: FIXED_TRASH_ID,
        well: 'A1', // TODO: Is 'A1' of the trash always the right place to drop tips?
      },
    },
  ]

  // TODO IMMEDIATELY: handle in getNextRobotState
  // import updateLiquidState from '../../dispenseUpdateLiquidState'
  //
  // robotState: {
  //     ...nextRobotState,
  //     liquidState: updateLiquidState(
  //       {
  //         invariantContext,
  //         pipetteId: pipetteId,
  //         labwareId: FIXED_TRASH_ID,
  //         useFullVolume: true,
  //         well: 'A1',
  //       },
  //       prevRobotState.liquidState
  //     ),
  //   },
  // }

  return {
    commands,
  }
}

export default dropTip
