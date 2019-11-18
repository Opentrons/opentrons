// @flow
import type { NextCommandCreator } from '../../types'
import { curryCommandCreator, reduceCommandCreatorsNext } from '../../utils'
import dropTip from './dropTip'

/** Drop all tips from equipped pipettes.
 * If no tips are attached to a pipette, do nothing.
 */
const dropAllTips: NextCommandCreator<null> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const pipetteIds: Array<string> = Object.keys(prevRobotState.pipettes)
  const commandCreators = pipetteIds.map(pipette =>
    curryCommandCreator(dropTip, { pipette })
  )
  return reduceCommandCreatorsNext(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}

export default dropAllTips
