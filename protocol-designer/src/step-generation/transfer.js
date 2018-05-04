// @flow
import flatMap from 'lodash/flatMap'
import zip from 'lodash/zip'
import mix from './mix'
import aspirate from './aspirate'
import dispense from './dispense'
import replaceTip from './replaceTip'
import {reduceCommandCreators} from './utils'
import touchTip from './touchTip'
import * as errorCreators from './errorCreators'
import type {TransferFormData, RobotState, CommandCreator} from './'

const transfer = (data: TransferFormData): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Transfer will iterate through a set of 1 or more source and destination wells.
    For each pair, it will aspirate from the source well, then dispense into the destination well.
    This pair of 1 source well and 1 dest well is internally called a "sub-transfer".

    If the volume to aspirate from a source well exceeds the max volume of the pipette,
    then each sub-transfer will be chunked into multiple asp-disp, asp-disp commands.

    A single uniform volume will be aspirated from every source well and dispensed into every dest well.
    In other words, all the sub-transfers will use the same uniform volume.

    =====

    For transfer, changeTip means:
    * 'always': before each aspirate, get a fresh tip
    * 'once': get a new tip at the beginning of the transfer step, and use it throughout
    * 'never': reuse the tip from the last step
  */

  // TODO Ian 2018-04-02 following ~10 lines are identical to first lines of consolidate.js...
  const actionName = 'transfer'

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

  const effectiveTransferVol = pipetteData.maxVolume - disposalVolume

  const chunksPerSubTransfer = Math.ceil(
    data.volume / effectiveTransferVol
  )
  const lastSubTransferVol = data.volume - ((chunksPerSubTransfer - 1) * effectiveTransferVol)

  // volume of each chunk in a sub-transfer
  const subTransferVolumes: Array<number> = Array(chunksPerSubTransfer - 1)
    .fill(effectiveTransferVol)
    .concat(lastSubTransferVol)

  const sourceDestPairs = zip(data.sourceWells, data.destWells)
  const commandCreators = flatMap(
    sourceDestPairs,
    (wellPair: [string, string], pairIdx: number): Array<CommandCreator> => {
      const [sourceWell, destWell] = wellPair

      return flatMap(
        subTransferVolumes,
        (subTransferVol: number, chunkIdx: number): Array<CommandCreator> => {
          // TODO IMMEDIATELY disposal vol ^^^
          const tipCommands: Array<CommandCreator> = (
            (data.changeTip === 'once' && chunkIdx === 0) ||
            data.changeTip === 'always')
              ? [replaceTip(data.pipette)]
              : []

          const preWetTipCommands = (data.preWetTip && chunkIdx === 0)
            ? mix(data.pipette, data.sourceLabware, sourceWell, Math.max(subTransferVol), 1)
            : []

          const mixBeforeAspirateCommands = (data.mixBeforeAspirate)
            ? mix(
              data.pipette,
              data.sourceLabware,
              sourceWell,
              data.mixBeforeAspirate.volume,
              data.mixBeforeAspirate.times
            )
            : []

          const touchTipAfterAspirateCommands = (data.touchTipAfterAspirate)
            ? [touchTip({
              pipette: data.pipette,
              labware: data.sourceLabware,
              well: sourceWell
            })]
            : []

          const touchTipAfterDispenseCommands = (data.touchTipAfterDispense)
            ? [touchTip({
              pipette: data.pipette,
              labware: data.destLabware,
              well: destWell
            })]
            : []

          const mixInDestinationCommands = (data.mixInDestination)
            ? mix(
              data.pipette,
              data.destLabware,
              destWell,
              data.mixInDestination.volume,
              data.mixInDestination.times
            )
            : []

          return [
            ...tipCommands,
            ...preWetTipCommands,
            ...mixBeforeAspirateCommands,
            aspirate({
              pipette: data.pipette,
              volume: subTransferVol,
              labware: data.sourceLabware,
              well: sourceWell
            }),
            ...touchTipAfterAspirateCommands,
            dispense({
              pipette: data.pipette,
              volume: subTransferVol,
              labware: data.destLabware,
              well: destWell
            }),
            ...touchTipAfterDispenseCommands,
            ...mixInDestinationCommands
          ]
        }
      )
    }
  )

  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default transfer
