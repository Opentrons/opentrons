// @flow
import type {CommandCreator, RobotState} from './'
import {reduceCommandCreators} from './utils'
import dropTip from './dropTip'

/** Drop all tips from equipped pipettes.
  * If no tips are attached to a pipette, do nothing.
  */
const dropAllTips = (): CommandCreator => (prevRobotState: RobotState) => {
  const pipetteIds = Object.keys(prevRobotState.instruments)
  const commandCreators = pipetteIds.map(pipetteId => dropTip(pipetteId))
  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default dropAllTips
