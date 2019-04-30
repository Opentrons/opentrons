// @flow
import type { CommandCreator, InvariantContext, RobotState } from '../../types'
import { reduceCommandCreators } from '../../utils'
import dropTip from './dropTip'

/** Drop all tips from equipped pipettes.
 * If no tips are attached to a pipette, do nothing.
 */
const dropAllTips = (): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  const pipetteIds = Object.keys(prevRobotState.pipettes)
  const commandCreators = pipetteIds.map(pipetteId => dropTip(pipetteId))
  return reduceCommandCreators(commandCreators)(
    invariantContext,
    prevRobotState
  )
}

export default dropAllTips
