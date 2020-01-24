// @flow
import { createSelector } from 'reselect'
import { getWellNamePerMultiTip } from '@opentrons/shared-data'
import { getWellSetForMultichannel } from '../utils'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

import mapValues from 'lodash/mapValues'

import { allSubsteps } from './substeps'
import * as StepGeneration from '../step-generation'
import { selectors as stepFormSelectors } from '../step-forms'
import { selectors as fileDataSelectors } from '../file-data'
import { getHoveredStepId, getHoveredSubstep } from '../ui/steps'

import type { WellGroup } from '@opentrons/components'
import type { Selector } from '../types'
import type { SubstepItemData } from '../steplist/types'
import type { PipetteEntity, LabwareEntity } from '../step-forms'

// TODO IMMEDIATELY use WellGroup here
export type AllWellHighlights = { [wellName: string]: true } // NOTE: all keys are true. There's a TODO in HighlightableLabware.js about making this a Set of well strings

function _wellsForPipette(
  pipetteEntity: PipetteEntity,
  labwareEntity: LabwareEntity,
  wells: Array<string>
): Array<string> {
  // `wells` is all the wells that pipette's channel 1 interacts with.
  if (pipetteEntity.spec.channels === 8) {
    return wells.reduce((acc, well) => {
      const setOfWellsForMulti = getWellNamePerMultiTip(labwareEntity.def, well)

      return setOfWellsForMulti ? [...acc, ...setOfWellsForMulti] : acc // setOfWellsForMulti is null
    }, [])
  }
  // single-channel
  return wells
}

function _getSelectedWellsForStep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  frame: StepGeneration.CommandsAndRobotState,
  invariantContext: StepGeneration.InvariantContext
): Array<string> {
  if (StepGeneration.getHasNoWellsFromCCArgs(stepArgs)) {
    return []
  }

  const pipetteId = StepGeneration.getPipetteIdFromCCArgs(stepArgs)
  const pipetteEntity = pipetteId
    ? invariantContext.pipetteEntities[pipetteId]
    : null
  const labwareEntity = invariantContext.labwareEntities[labwareId]

  if (!pipetteEntity || !labwareEntity) {
    return []
  }

  const getWells = (wells: Array<string>) =>
    _wellsForPipette(pipetteEntity, labwareEntity, wells)

  let wells = []

  // If we're moving liquids within a single labware,
  // both the source and dest wells together need to be selected.
  if (stepArgs.commandCreatorFnName === 'mix') {
    if (stepArgs.labware === labwareId) {
      wells.push(...getWells(stepArgs.wells))
    }
  } else if (stepArgs.commandCreatorFnName === 'transfer') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells(stepArgs.sourceWells))
    }
    if (stepArgs.destLabware === labwareId) {
      wells.push(...getWells(stepArgs.destWells))
    }
  } else if (stepArgs.commandCreatorFnName === 'consolidate') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells(stepArgs.sourceWells))
    }
    if (stepArgs.destLabware === labwareId) {
      wells.push(...getWells([stepArgs.destWell]))
    }
  } else if (stepArgs.commandCreatorFnName === 'distribute') {
    if (stepArgs.sourceLabware === labwareId) {
      wells.push(...getWells([stepArgs.sourceWell]))
    }
    if (stepArgs.destLabware === labwareId) {
      wells.push(...getWells(stepArgs.destWells))
    }
  }

  frame.commands.forEach((c: Command) => {
    if (c.command === 'pickUpTip' && c.params.labware === labwareId) {
      const commandWellName = c.params.well
      const pipetteId = c.params.pipette
      const pipetteSpec =
        invariantContext.pipetteEntities[pipetteId]?.spec || {}

      if (pipetteSpec.channels === 1) {
        wells.push(commandWellName)
      } else if (pipetteSpec.channels === 8) {
        const wellSet =
          getWellSetForMultichannel(
            invariantContext.labwareEntities[labwareId].def,
            commandWellName
          ) || []
        wells.push(...wellSet)
      } else {
        console.error(
          `Unexpected number of channels: ${pipetteSpec.channels ||
            '?'}. Could not get tip highlight state`
        )
      }
    }
  })

  return wells
}

/** Scan through given substep rows to get a list of source/dest wells for the given labware */
function _getSelectedWellsForSubstep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  substeps: ?SubstepItemData,
  substepIndex: number,
  invariantContext: StepGeneration.InvariantContext
): Array<string> {
  if (substeps === null) {
    return []
  }

  // TODO: Ian 2018-10-01 proper type for wellField enum
  function getWells(wellField: 'source' | 'dest'): Array<string> {
    // ignore substeps with no well fields
    // TODO: Ian 2019-01-29 be more explicit about commandCreatorFnName,
    // don't rely so heavily on the fact that their well fields are the same now
    if (!substeps || substeps.commandCreatorFnName === 'delay') return []
    if (substeps.rows && substeps.rows[substepIndex]) {
      // single-channel
      const wellData = substeps.rows[substepIndex][wellField]
      return wellData && wellData.well ? [wellData.well] : []
    }

    if (substeps.multiRows && substeps.multiRows[substepIndex]) {
      // multi-channel
      return substeps.multiRows[substepIndex].reduce((acc, multiRow) => {
        const wellData = multiRow[wellField]
        return wellData && wellData.well ? [...acc, wellData.well] : acc
      }, [])
    }
    return []
  }

  let wells: Array<string> = []

  // single-labware steps
  if (
    stepArgs.commandCreatorFnName === 'mix' &&
    stepArgs.labware &&
    stepArgs.labware === labwareId
  ) {
    return getWells('source')
  }

  // source + dest steps
  // $FlowFixMe: property `sourceLabware` is missing in `MixArgs`
  if (stepArgs.sourceLabware && stepArgs.sourceLabware === labwareId) {
    wells.push(...getWells('source'))
  }
  // $FlowFixMe: property `destLabware` is missing in `MixArgs`
  if (stepArgs.destLabware && stepArgs.destLabware === labwareId) {
    wells.push(...getWells('dest'))
  }

  if (substeps && substeps.substepType === 'sourceDest') {
    let tipWellSet = []
    if (substeps.multichannel) {
      const { activeTips } = substeps.multiRows[substepIndex][0] // just use first multi row

      if (activeTips && activeTips.labware === labwareId) {
        const multiTipWellSet = getWellSetForMultichannel(
          invariantContext.labwareEntities[labwareId].def,
          activeTips.well
        )
        if (multiTipWellSet) tipWellSet = multiTipWellSet
      }
    } else {
      // single-channel
      const { activeTips } = substeps.rows[substepIndex]
      if (activeTips && activeTips.labware === labwareId && activeTips.well)
        tipWellSet = [activeTips.well]
    }
    wells.push(...tipWellSet)
  }

  return wells
}

export const wellHighlightsByLabwareId: Selector<{
  [labwareId: string]: WellGroup,
}> = createSelector(
  fileDataSelectors.getRobotStateTimeline,
  stepFormSelectors.getInvariantContext,
  stepFormSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  getHoveredSubstep,
  allSubsteps,
  stepFormSelectors.getOrderedStepIds,
  (
    robotStateTimeline,
    invariantContext,
    allStepArgsAndErrors,
    hoveredStepId,
    hoveredSubstep,
    allSubsteps,
    orderedStepIds
  ) => {
    const timeline = robotStateTimeline.timeline
    const stepId = hoveredStepId
    const timelineIndex = orderedStepIds.findIndex(i => i === stepId)
    const frame = timeline[timelineIndex]
    const robotState = frame && frame.robotState
    const stepArgs =
      stepId != null &&
      allStepArgsAndErrors[stepId] &&
      allStepArgsAndErrors[stepId].stepArgs

    if (!robotState || stepId == null || !stepArgs) {
      // nothing hovered, or no stepArgs for step
      return {}
    }

    // replace value of each labware with highlighted wells info
    return mapValues(
      robotState.liquidState.labware,
      (
        labwareLiquids: StepGeneration.SingleLabwareLiquidState,
        labwareId: string
      ): AllWellHighlights => {
        let selectedWells: Array<string> = []
        if (hoveredSubstep != null) {
          // wells for hovered substep
          selectedWells = _getSelectedWellsForSubstep(
            stepArgs,
            labwareId,
            allSubsteps[stepId],
            hoveredSubstep.substepIndex,
            invariantContext
          )
        } else {
          // wells for step overall
          selectedWells = _getSelectedWellsForStep(
            stepArgs,
            labwareId,
            frame,
            invariantContext
          )
        }

        // return selected wells eg {A1: null, B4: null}
        return selectedWells.reduce(
          (acc: AllWellHighlights, well) => ({ ...acc, [well]: null }),
          {}
        )
      }
    )
  }
)
