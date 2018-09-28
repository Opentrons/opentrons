// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import {FIXED_TRASH_ID} from '../constants'
import {aspirate, dispense, blowout, replaceTip, touchTip, reduceCommandCreators} from './'
import {mixUtil} from './mix'
import * as errorCreators from './errorCreators'
import type {ConsolidateFormData, RobotState, CommandCreator} from './'

const consolidate = (data: ConsolidateFormData): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.

    =====

    For consolidate, changeTip means:
    * 'always': before the first aspirate in a single asp-asp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the consolidate step, and use it throughout
    * 'never': reuse the tip from the last step
  */
  const actionName = 'consolidate'

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

  const commandCreators = flatMap(
    chunk(data.sourceWells, maxWellsPerChunk),
    (sourceWellChunk: Array<string>, chunkIndex: number): Array<CommandCreator> => {
      // Aspirate commands for all source wells in the chunk
      const aspirateCommands = flatMap(sourceWellChunk, (sourceWell: string, wellIndex: number): Array<CommandCreator> => {
        const isFirstWellInChunk = wellIndex === 0

        const touchTipAfterAspirateCommand = data.touchTipAfterAspirate
          ? [touchTip({
            pipette: data.pipette,
            labware: data.sourceLabware,
            well: sourceWell,
          })]
          : []

        return [
          aspirate({
            pipette: data.pipette,
            volume: data.volume + (isFirstWellInChunk ? disposalVolume : 0),
            labware: data.sourceLabware,
            well: sourceWell,
            offsetFromBottomMm: aspirateOffsetFromBottomMm,
          }),
          ...touchTipAfterAspirateCommand,
        ]
      })

      let tipCommands: Array<CommandCreator> = []

      if (
        data.changeTip === 'always' ||
        (data.changeTip === 'once' && chunkIndex === 0)
      ) {
        tipCommands = [replaceTip(data.pipette)]
      }

      const touchTipAfterDispenseCommands = data.touchTipAfterDispense
        ? [touchTip({
          pipette: data.pipette,
          labware: data.destLabware,
          well: data.destWell,
        })]
        : []

      const trashTheDisposalVol = disposalVolume
        ? [
          blowout({
            pipette: data.pipette,
            labware: FIXED_TRASH_ID,
            well: 'A1',
          }),
        ]
        : []

      const mixBeforeCommands = (data.mixFirstAspirate)
        ? mixUtil(
          data.pipette,
          data.sourceLabware,
          sourceWellChunk[0],
          data.mixFirstAspirate.volume,
          data.mixFirstAspirate.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm
        )
        : []

      const preWetTipCommands = (data.preWetTip)
        // Pre-wet tip is equivalent to a single mix, with volume equal to the consolidate volume.
        ? mixUtil(
          data.pipette,
          data.sourceLabware,
          sourceWellChunk[0],
          data.volume,
          1,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm
        )
        : []

      const mixAfterCommands = (data.mixInDestination)
        ? mixUtil(
          data.pipette,
          data.destLabware,
          data.destWell,
          data.mixInDestination.volume,
          data.mixInDestination.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm
        )
        : []

      const blowoutCommand = (data.blowout)
        ? [
          blowout({
            pipette: data.pipette,
            labware: data.blowout, // TODO Ian 2018-05-04 more explicit test for non-trash blowout destination
            well: 'A1', // TODO LATER: should user be able to specify the blowout well?
          }),
        ]
        : []

      return [
        ...tipCommands,
        ...mixBeforeCommands,
        ...preWetTipCommands, // NOTE when you both mix-before and pre-wet tip, it's kinda redundant. Prewet is like mixing once.
        ...aspirateCommands,
        dispense({
          pipette: data.pipette,
          volume: data.volume * sourceWellChunk.length,
          labware: data.destLabware,
          well: data.destWell,
          offsetFromBottomMm: dispenseOffsetFromBottomMm,
        }),
        ...touchTipAfterDispenseCommands,
        ...trashTheDisposalVol,
        ...mixAfterCommands,
        ...blowoutCommand,
      ]
    }
  )

  return commandCreators
}

export default consolidate
