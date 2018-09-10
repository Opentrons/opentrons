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

type AllWellHighlights = {[wellName: string]: true} // NOTE: all keys are true
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

  const getWells = (wells: Array<string>) => _wellsForPipette(pipetteChannels, labwareType, wells)

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

  function getWells (wellField): Array<string> {
    if (substeps && substeps.rows && substeps.rows[substepIndex]) {
      // single-channel
      const well = substeps.rows[substepIndex][wellField]
      return well ? [well] : []
    }

    if (substeps && substeps.multiRows && substeps.multiRows[substepIndex]) {
      // multi-channel
      return substeps.multiRows[substepIndex].reduce((acc, multiRow) => {
        const well = multiRow[wellField]
        return well ? [...acc, well] : acc
      }, [])
    }
    return []
  }

  let wells: Array<string> = []

  // TODO Ian 2018-05-09 re-evaluate the steptype handling here
  // single-labware steps
  if (form.stepType === 'mix' && form.labware && form.labware === labwareId) {
    return getWells('sourceWell')
  }

  // source + dest steps
  // $FlowFixMe: property `sourceLabware` is missing in `MixFormData`
  if (form.sourceLabware && form.sourceLabware === labwareId) {
    wells.push(...getWells('sourceWell'))
  }
  // $FlowFixMe: property `destLabware` is missing in `MixFormData`
  if (form.destLabware && form.destLabware === labwareId) {
    wells.push(...getWells('destWell'))
  }

  return wells
}

export const wellHighlightsForSteps: Selector<Array<AllWellHighlightsAllLabware>> = createSelector(
  fileDataSelectors.robotStateTimeline,
  steplistSelectors.validatedForms,
  steplistSelectors.getHoveredStepId,
  steplistSelectors.getHoveredSubstep,
  allSubsteps,
  steplistSelectors.orderedSteps,
  (_robotStateTimeline, _forms, _hoveredStepId, _hoveredSubstep, _allSubsteps, _orderedSteps) => {
    const timeline = _robotStateTimeline.timeline

    function highlightedWellsForLabwareAtStep (
      labwareLiquids: StepGeneration.SingleLabwareLiquidState,
      labwareId: string,
      robotState: StepGeneration.RobotState,
      form: StepGeneration.CommandCreatorData,
      stepId: number
    ): AllWellHighlights {
      let selectedWells: Array<string> = []
      if (form && _hoveredStepId === stepId) {
        // only show selected wells when user is **hovering** over the step
        if (_hoveredSubstep) {
          // wells for hovered substep
          selectedWells = _getSelectedWellsForSubstep(
            form,
            labwareId,
            _allSubsteps[_hoveredSubstep.stepId],
            _hoveredSubstep.substepIndex
          )
        } else {
          // wells for step overall
          selectedWells = _getSelectedWellsForStep(form, labwareId, robotState)
        }
      }

      // return selected wells eg {A1: true, B4: true}
      return selectedWells.reduce((acc, well) => ({...acc, [well]: true}), {})
    }

    function highlightedWellsForTimelineFrame (liquidState, timelineIndex): AllWellHighlightsAllLabware {
      const robotState = timeline[timelineIndex].robotState
      const stepId = _orderedSteps[timelineIndex]
      const form = _forms[stepId] && _forms[stepId].validatedForm

      // replace value of each labware with highlighted wells info
      return mapValues(
        liquidState,
        (labwareLiquids: StepGeneration.SingleLabwareLiquidState, labwareId: string) => (form)
          ? highlightedWellsForLabwareAtStep(
            labwareLiquids,
            labwareId,
            robotState,
            form,
            stepId
          )
        : {} // no form -> no highlighted wells
      )
    }

    const liquidStateTimeline = timeline.map(t => t.robotState.liquidState.labware)
    return liquidStateTimeline.map(highlightedWellsForTimelineFrame)
  }
)
