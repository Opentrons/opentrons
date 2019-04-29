// @flow
import { createSelector } from 'reselect'
import { computeWellAccess } from '@opentrons/shared-data'

import mapValues from 'lodash/mapValues'

import { allSubsteps } from './substeps'
import * as StepGeneration from '../step-generation'
import { selectors as stepFormSelectors } from '../step-forms'
import { selectors as fileDataSelectors } from '../file-data'
import { selectors as stepsSelectors } from '../ui/steps'

import type { Selector } from '../types'
import type { SubstepItemData } from '../steplist/types'
import type { PipetteEntity, LabwareEntity } from '../step-forms'

type AllWellHighlights = { [wellName: string]: true } // NOTE: all keys are true. There's a TODO in HighlightableLabware.js about making this a Set of well strings
type AllWellHighlightsAllLabware = { [labwareId: string]: AllWellHighlights }

function _wellsForPipette(
  pipetteEntity: PipetteEntity,
  labwareEntity: LabwareEntity,
  wells: Array<string>
): Array<string> {
  // `wells` is all the wells that pipette's channel 1 interacts with.
  if (pipetteEntity.spec.channels === 8) {
    return wells.reduce((acc, well) => {
      const setOfWellsForMulti = computeWellAccess(labwareEntity.def, well)

      return setOfWellsForMulti ? [...acc, ...setOfWellsForMulti] : acc // setOfWellsForMulti is null
    }, [])
  }
  // single-channel
  return wells
}

function _getSelectedWellsForStep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  invariantContext: StepGeneration.InvariantContext
): Array<string> {
  if (stepArgs.commandCreatorFnName === 'delay') {
    return []
  }

  const pipetteId = stepArgs.pipette
  const pipetteEntity = invariantContext.pipetteEntities[pipetteId]
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

  return wells
}

/** Scan through given substep rows to get a list of source/dest wells for the given labware */
function _getSelectedWellsForSubstep(
  stepArgs: StepGeneration.CommandCreatorArgs,
  labwareId: string,
  substeps: ?SubstepItemData,
  substepIndex: number
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

  return wells
}

export const wellHighlightsByLabwareId: Selector<AllWellHighlightsAllLabware> = createSelector(
  fileDataSelectors.getRobotStateTimeline,
  stepFormSelectors.getInvariantContext,
  stepFormSelectors.getArgsAndErrorsByStepId,
  stepsSelectors.getHoveredStepId,
  stepsSelectors.getHoveredSubstep,
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
            hoveredSubstep.substepIndex
          )
        } else {
          // wells for step overall
          selectedWells = _getSelectedWellsForStep(
            stepArgs,
            labwareId,
            invariantContext
          )
        }

        // return selected wells eg {A1: true, B4: true}
        return selectedWells.reduce(
          (acc: AllWellHighlights, well) => ({ ...acc, [well]: true }),
          {}
        )
      }
    )
  }
)
