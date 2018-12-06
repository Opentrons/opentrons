// @flow
// TODO Ian 2018-05-03
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import flatten from 'lodash/flatten'
// import {FIXED_TRASH_ID} from '../constants'
import * as errorCreators from '../../errorCreators'
import {getPipetteWithTipMaxVol} from '../../robotStateSelectors'
import type {DistributeFormData, RobotState, CommandCreator, CompoundCommandCreator, TransferLikeFormDataFields, TransferFormData} from '../../types'
import {aspirate, dispense, blowout, replaceTip, touchTip} from '../atomic'
import transfer from './transfer'
import {mixUtil} from './mix'

const distribute = (data: DistributeFormData): CompoundCommandCreator => (prevRobotState: RobotState) => {
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
    return [(_robotState) => ({
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette: data.pipette})],
    })]
  }

  const {
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  } = data

  // TODO error on negative data.disposalVolume?
  const disposalVolume = (data.disposalVolume && data.disposalVolume > 0)
    ? data.disposalVolume
    : 0

  const maxWellsPerChunk = Math.floor(
    (getPipetteWithTipMaxVol(data.pipette, prevRobotState) - disposalVolume) / data.volume
  )

  const {pipette} = data

  if (maxWellsPerChunk === 0) {
    // distribute vol exceeds pipette vol, break up into 1 transfer per dest well
    const transferCommands = data.destWells.map((destWell, wellIndex) => {
      let changeTip = data.changeTip
      // 'once' means 'once per all inner transfers'
      // so it should only apply to the first inner transfer
      if (data.changeTip === 'once') {
        changeTip = (wellIndex === 0) ? 'once' : 'never'
      }
      const transferData: TransferFormData = {
        ...(data: TransferLikeFormDataFields),
        changeTip,
        stepType: 'transfer',
        sourceWells: [data.sourceWell],
        destWells: [destWell],
        mixBeforeAspirate: data.mixBeforeAspirate,
        mixInDestination: null,
        blowoutLocation: null,
      }
      return transfer(transferData)
    })

    return flatten(transferCommands.map(tC => tC(prevRobotState)))
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
                offsetFromBottomMm: data.touchTipAfterDispenseOffsetMmFromBottom,
              }),
            ]
            : []

          return [
            dispense({
              pipette,
              volume: data.volume,
              labware: data.destLabware,
              well: destWell,
              'flow-rate': dispenseFlowRateUlSec,
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

      // TODO: BC 2018-11-29 instead of disposalLabware and disposalWell use blowoutLocation
      let blowoutCommands = []
      if (data.disposalVolume && data.disposalLabware && data.disposalWell) {
        blowoutCommands = [blowout({
          pipette: data.pipette,
          labware: data.disposalLabware,
          well: data.disposalWell,
        })]
      }

      const touchTipAfterAspirateCommand = data.touchTipAfterAspirate
        ? [
          touchTip({
            pipette: data.pipette,
            labware: data.sourceLabware,
            well: data.sourceWell,
            offsetFromBottomMm: data.touchTipAfterDispenseOffsetMmFromBottom,
          }),
        ]
        : []

      const mixBeforeAspirateCommands = (data.mixBeforeAspirate)
        ? mixUtil({
          pipette: data.pipette,
          labware: data.sourceLabware,
          well: data.sourceWell,
          volume: data.mixBeforeAspirate.volume,
          times: data.mixBeforeAspirate.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm,
          aspirateFlowRateUlSec,
          dispenseFlowRateUlSec,
        })
        : []

      return [
        ...tipCommands,
        ...mixBeforeAspirateCommands,
        aspirate({
          pipette,
          volume: data.volume * destWellChunk.length + disposalVolume,
          labware: data.sourceLabware,
          well: data.sourceWell,
          'flow-rate': aspirateFlowRateUlSec,
          offsetFromBottomMm: aspirateOffsetFromBottomMm,
        }),
        ...touchTipAfterAspirateCommand,

        ...dispenseCommands,
        ...blowoutCommands,
      ]
    }
  )

  return commandCreators
}

export default distribute
