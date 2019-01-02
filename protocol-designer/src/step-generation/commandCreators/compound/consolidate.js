// @flow
import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'
import * as errorCreators from '../../errorCreators'
import {getPipetteWithTipMaxVol} from '../../robotStateSelectors'
import type {ConsolidateFormData, RobotState, CommandCreator, CompoundCommandCreator} from '../../types'
import {blowoutUtil} from '../../utils'
import {aspirate, dispense, replaceTip, touchTip} from '../atomic'
import {mixUtil} from './mix'

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
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
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
            'flow-rate': aspirateFlowRateUlSec,
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
        ? mixUtil({
          pipette: data.pipette,
          labware: data.sourceLabware,
          well: sourceWellChunk[0],
          volume: data.mixFirstAspirate.volume,
          times: data.mixFirstAspirate.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm,
          aspirateFlowRateUlSec,
          dispenseFlowRateUlSec,
        })
        : []

      const preWetTipCommands = (data.preWetTip)
        // Pre-wet tip is equivalent to a single mix, with volume equal to the consolidate volume.
        ? mixUtil({
          pipette: data.pipette,
          labware: data.sourceLabware,
          well: sourceWellChunk[0],
          volume: data.volume,
          times: 1,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm,
          aspirateFlowRateUlSec,
          dispenseFlowRateUlSec,
        })
        : []

      const mixAfterCommands = (data.mixInDestination)
        ? mixUtil({
          pipette: data.pipette,
          labware: data.destLabware,
          well: data.destWell,
          volume: data.mixInDestination.volume,
          times: data.mixInDestination.times,
          aspirateOffsetFromBottomMm,
          dispenseOffsetFromBottomMm,
        })
        : []

      const blowoutCommand = blowoutUtil(
        data.pipette,
        data.sourceLabware,
        sourceWellChunk[0],
        data.destLabware,
        data.destWell,
        data.blowoutLocation,
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
          'flow-rate': dispenseFlowRateUlSec,
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
