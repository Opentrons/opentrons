// @flow
import type { CommandCreator } from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { dropTip } from './dropTip'

/** Drop all tips from equipped pipettes.
 * If no tips are attached to a pipette, do nothing.
 */
export const dropAllTips: CommandCreator<null> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const pipetteIds: Array<string> = Object.keys(prevRobotState.pipettes)
  const commandCreators = pipetteIds.map(pipette =>
    curryCommandCreator(dropTip, { pipette })
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
