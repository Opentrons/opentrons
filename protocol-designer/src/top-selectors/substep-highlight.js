// @flow
import {createSelector} from 'reselect'
import {computeWellAccess} from '@opentrons/shared-data'

import mapValues from 'lodash/mapValues'

import {allSubsteps} from './substeps'
import * as StepGeneration from '../step-generation'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'

import type {Selector} from '../types'
import type {SubstepItemData} from '../steplist/types'

type AllWellHighlights = {[wellName: string]: true} // NOTE: all keys are true. There's a TODO in SelectablePlate.js about making this a Set of well strings
type AllWellHighlightsAllLabware = {[labwareId: string]: AllWellHighlights}

function _wellsForPipette (pipetteChannels: 1 | 8, labwareType: string, wells: Array<string>): Array<string> {
  // `wells` is all the wells that pipette's channel 1 interacts with.
  if (pipetteChannels === 8) {
    return wells.reduce((acc, well) => {
      const setOfWellsForMulti = computeWellAccess(labwareType, well)

      return setOfWellsForMulti
        ? [...acc, ...setOfWellsForMulti]
        : acc // setOfWellsForMulti is null
    }, [])
  }
  // single-channel
  return wells
}

function _getSelectedWellsForStep (
  form: StepGeneration.CommandCreatorData,
  labwareId: string,
  robotState: StepGeneration.RobotState
): Array<string> {
  if (form.stepType === 'pause') {
    return []
  }

  const pipetteId = form.pipette
  const pipetteChannels = StepGeneration.getPipetteChannels(pipetteId, robotState)
  const labwareType = StepGeneration.getLabwareType(labwareId, robotState)

  if (!pipetteChannels || !labwareType) {
    return []
  }

  const getWells = (wells: Array<string>) =>
    _wellsForPipette(pipetteChannels, labwareType, wells)

  let wells = []

  // If we're moving liquids within a single labware,
  // both the source and dest wells together need to be selected.
  if (form.stepType === 'mix') {
    if (form.labware === labwareId) {
      wells.push(...getWells(form.wells))
    }
  } else if (form.stepType === 'transfer') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells(form.destWells))
    }
  } else if (form.stepType === 'consolidate') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells([form.destWell]))
    }
  } else if (form.stepType === 'distribute') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells([form.sourceWell]))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells(form.destWells))
    }
  }

  return wells
}

/** Scan through given substep rows to get a list of source/dest wells for the given labware */
function _getSelectedWellsForSubstep (
  form: StepGeneration.CommandCreatorData,
  labwareId: string,
  substeps: ?SubstepItemData,
  substepIndex: number
): Array<string> {
  if (substeps === null) {
    return []
  }

  // TODO: Ian 2018-10-01 proper type for wellField enum
  function getWells (wellField: 'source' | 'dest'): Array<string> {
    if (substeps && substeps.rows && substeps.rows[substepIndex]) {
      // single-channel
      const wellData = substeps.rows[substepIndex][wellField]
      return (wellData && wellData.well) ? [wellData.well] : []
    }

    if (substeps && substeps.multiRows && substeps.multiRows[substepIndex]) {
      // multi-channel
      return substeps.multiRows[substepIndex].reduce((acc, multiRow) => {
        const wellData = multiRow[wellField]
        return (wellData && wellData.well) ? [...acc, wellData.well] : acc
      }, [])
    }
    return []
  }

  let wells: Array<string> = []

  // TODO Ian 2018-05-09 re-evaluate the steptype handling here
  // single-labware steps
  if (form.stepType === 'mix' && form.labware && form.labware === labwareId) {
    return getWells('source')
  }

  // source + dest steps
  // $FlowFixMe: property `sourceLabware` is missing in `MixFormData`
  if (form.sourceLabware && form.sourceLabware === labwareId) {
    wells.push(...getWells('source'))
  }
  // $FlowFixMe: property `destLabware` is missing in `MixFormData`
  if (form.destLabware && form.destLabware === labwareId) {
    wells.push(...getWells('dest'))
  }

  return wells
}

export const wellHighlightsByLabwareId: Selector<AllWellHighlightsAllLabware> = createSelector(
  fileDataSelectors.robotStateTimeline,
  steplistSelectors.validatedForms,
  steplistSelectors.getHoveredStepId,
  steplistSelectors.getHoveredSubstep,
  allSubsteps,
  steplistSelectors.orderedSteps,
  (robotStateTimeline, forms, hoveredStepId, hoveredSubstep, allSubsteps, orderedSteps) => {
    const timeline = robotStateTimeline.timeline
    const stepId = hoveredStepId
    const timelineIndex = orderedSteps.findIndex(i => i === stepId)
    const frame = timeline[timelineIndex]
    const robotState = frame && frame.robotState
    const form = stepId && forms[stepId] && forms[stepId].validatedForm

    if (!robotState || !stepId || !form) {
      // nothing hovered, or no form for step
      return {}
    }

    // replace value of each labware with highlighted wells info
    return mapValues(
      robotState.liquidState.labware,
      (labwareLiquids: StepGeneration.SingleLabwareLiquidState, labwareId: string): AllWellHighlights => {
        let selectedWells: Array<string> = []
        if (hoveredSubstep) {
          // wells for hovered substep
          selectedWells = _getSelectedWellsForSubstep(
            form,
            labwareId,
            allSubsteps[stepId],
            hoveredSubstep.substepIndex
          )
        } else {
          // wells for step overall
          selectedWells = _getSelectedWellsForStep(form, labwareId, robotState)
        }

        // return selected wells eg {A1: true, B4: true}
        return selectedWells.reduce((acc: AllWellHighlights, well) =>
          ({...acc, [well]: true}), {})
      }
    )
  }
)
