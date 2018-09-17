// @flow
// TODO Ian 2018-05-03
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
// import {FIXED_TRASH_ID} from '../constants'
import {aspirate, dispense, blowout, replaceTip, touchTip, reduceCommandCreators} from './'
import transfer from './transfer'
import {mixUtil} from './mix'
import * as errorCreators from './errorCreators'
import type {DistributeFormData, RobotState, CommandCreator, TransferLikeFormDataFields, TransferFormData} from './'

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
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette: data.pipette})],
    }
  }

  const {
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  } = data

  // TODO error on negative data.disposalVolume?
  const disposalVolume = (data.disposalVolume && data.disposalVolume > 0)
    ? data.disposalVolume
    : 0

  const maxWellsPerChunk = Math.floor(
    (pipetteData.maxVolume - disposalVolume) / data.volume
  )

  const {pipette} = data

  if (maxWellsPerChunk === 0) {
    // distribute vol exceeds pipette vol, break up into 1 transfer per dest well
    const transferCommands = data.destWells.map((destWell) => {
      const transferData: TransferFormData = {
        ...(data: TransferLikeFormDataFields),
        stepType: 'transfer',
        sourceWells: [data.sourceWell],
        destWells: [destWell],
        mixBeforeAspirate: data.mixBeforeAspirate,
        mixInDestination: null,
      }
      return transfer(transferData)
    })

    return reduceCommandCreators(transferCommands)(prevRobotState)
  }

  const commandCreators = flatMap(
    chunk(data.destWells, maxWellsPerChunk),
    (destWellChunk: Array<string>, chunkIndex: number): Array<CommandCreator> => {
      const dispenseCommands = flatMap(
        destWellChunk,
        (destWell: string, wellIndex: number): Array<CommandCreator> => {
          const touchTipAfterDispenseCommand = data.touchTipAfterDispense
            ? [
              touchTip({
                pipette,
                labware: data.destLabware,
                well: destWell,
              }),
            ]
            : []

          return [
            dispense({
              pipette,
              volume: data.volume,
              labware: data.destLabware,
              well: destWell,
              offsetFromBottomMm: dispenseOffsetFromBottomMm,
            }),
            ...touchTipAfterDispenseCommand,
          ]
        })

      // NOTE: identical to consolidate
      let tipCommands: Array<CommandCreator> = []

      if (
        data.changeTip === 'always' ||
        (data.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [replaceTip(data.pipette)]
      }

      let blowoutCommands = []
      const {disposalVolume, disposalDestination} = data
      console.log({disposalDestination, disposalVolume})
      if (data.disposalVolume && data.disposalDestination === 'source_well') {
        blowoutCommands = [blowout({
          pipette: data.pipette,
          labware: data.sourceLabware,
          well: data.sourceWell,
        })]
      } else if (data.disposalVolume && data.disposalDestination) {
        // if disposalDestination is not 'source_well' assume it is a labware (e.g. fixed-trash)
        blowoutCommands = [blowout({
          pipette: data.pipette,
          labware: data.disposalDestination,
          well: 'A1',
        })]
      }


      const touchTipAfterAspirateCommand = data.touchTipAfterAspirate
        ? [
          touchTip({
            pipette: data.pipette,
            labware: data.sourceLabware,
            well: data.sourceWell,
          }),
        ]
        : []

      const mixBeforeAspirateCommands = (data.mixBeforeAspirate)
        ? mixUtil(
          data.pipette,
          data.sourceLabware,
          data.sourceWell,
          data.mixBeforeAspirate.volume,
          data.mixBeforeAspirate.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm
        )
        : []

      return [
        ...tipCommands,
        ...mixBeforeAspirateCommands,
        aspirate({
          pipette,
          volume: data.volume * destWellChunk.length + disposalVolume,
          labware: data.sourceLabware,
          well: data.sourceWell,
          offsetFromBottomMm: aspirateOffsetFromBottomMm,
        }),
        ...touchTipAfterAspirateCommand,

        ...dispenseCommands,
        ...blowoutCommands,
      ]
    }
  )

  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default distribute
