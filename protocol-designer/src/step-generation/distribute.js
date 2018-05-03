// @flow
// TODO Ian 2018-05-03
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
// import {FIXED_TRASH_ID} from '../constants'
import {aspirate, dispense, reduceCommandCreators} from './' // blowout, replaceTip, touchTip,
// import mix from './mix'
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

  // TODO Ian 2018-05-03 next ~20 lines match consolidate.js
  const actionName = 'distribute'

  const pipetteData = prevRobotState.instruments[data.pipette]
  if (!pipetteData) {
    // bail out before doing anything else
    return {
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette: data.pipette})]
    }
  }

  // TODO error on negative data.disposalVolume?
  const disposalVolume = (data.disposalVolume && data.disposalVolume > 0)
    ? data.disposalVolume
    : 0

  const maxWellsPerChunk = Math.floor(
    (pipetteData.maxVolume - disposalVolume) / data.volume
  )

  const {pipette} = data

  const commandCreators = flatMap(
    chunk(data.destWells, maxWellsPerChunk),
    (destWellChunk: Array<string>, chunkIndex: number): Array<CommandCreator> => {
      const dispenseCommands = flatMap(
        destWellChunk,
        (destWell: string, wellIndex: number): Array<CommandCreator> => {
          return [
            dispense({
              pipette,
              volume: data.volume,
              labware: data.destLabware,
              well: destWell
            })
          ]
        })

      return [
        aspirate({
          pipette,
          volume: data.volume * destWellChunk.length,
          labware: data.sourceLabware,
          well: data.sourceWell
        }),
        ...dispenseCommands
      ]
    }
  )

  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default distribute
