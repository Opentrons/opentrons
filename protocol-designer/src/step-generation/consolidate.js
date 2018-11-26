// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import {aspirate, dispense, replaceTip, touchTip} from './'
import {mixUtil} from './mix'
import {blowoutUtil} from './blowout'
import * as errorCreators from './errorCreators'
import {getPipetteWithTipMaxVol} from './robotStateSelectors'
import type {ConsolidateFormData, RobotState, CommandCreator, CompoundCommandCreator} from './'

const consolidate = (data: ConsolidateFormData): CompoundCommandCreator => (prevRobotState: RobotState) => {
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
    return [(_robotState) => ({
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette: data.pipette})],
    })]
  }

  const {
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
  } = data

  const maxWellsPerChunk = Math.floor(
    getPipetteWithTipMaxVol(data.pipette, prevRobotState) / data.volume
  )

  const commandCreators = flatMap(
    chunk(data.sourceWells, maxWellsPerChunk),
    (sourceWellChunk: Array<string>, chunkIndex: number): Array<CommandCreator> => {
      // Aspirate commands for all source wells in the chunk
      const aspirateCommands = flatMap(sourceWellChunk, (sourceWell: string, wellIndex: number): Array<CommandCreator> => {
        const touchTipAfterAspirateCommand = data.touchTipAfterAspirate
          ? [touchTip({
            pipette: data.pipette,
            labware: data.sourceLabware,
            well: sourceWell,
            offsetFromBottomMm: data.touchTipAfterAspirateOffsetMmFromBottom,
          })]
          : []

        return [
          aspirate({
            pipette: data.pipette,
            volume: data.volume,
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
          offsetFromBottomMm: data.touchTipAfterDispenseOffsetMmFromBottom,
        })]
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


      const blowoutCommand = blowoutUtil(
        data.pipette,
        data.sourceLabware,
        sourceWellChunk[0],
        data.destLabware,
        data.destWell,
        data.blowoutDestination,
      )

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
        ...mixAfterCommands,
        ...blowoutCommand,
      ]
    }
  )

  return commandCreators
}

export default consolidate
