// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import {FIXED_TRASH_ID} from '../constants'
import {aspirate, dispense, blowout, replaceTip, touchTip, reduceCommandCreators} from './'
import mix from './mix'
import * as errorCreators from './errorCreators'
import type {DistributeFormData, RobotState, CommandCreator} from './'

const distribute = (data: DistributeFormData): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Distribute will aspirate from a single source well into multiple destination wells.

    If the volume to aspirate from the source well exceeds the max volume of the pipette,
    then distribute will be broken up into multiple asp-disp-disp, asp-disp-disp cycles.

    A single uniform volume will be aspirated to every destination well.

    =====

    For distribute, changeTip means:
    * 'always': before the first aspirate in a single asp-disp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the distribute step, and use it throughout
    * 'never': reuse the tip from the last step
  */

  const commandCreators: Array<CommandCreator> = [] // TODO
  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default distribute
