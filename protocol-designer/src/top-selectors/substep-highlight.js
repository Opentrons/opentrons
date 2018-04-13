// @flow
import {createSelector} from 'reselect'
import {computeWellAccess} from '@opentrons/labware-definitions'

import mapValues from 'lodash/mapValues'

import {allSubsteps} from './substeps'
import * as StepGeneration from '../step-generation'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {selectors as fileDataSelectors} from '../file-data'

import type {Selector} from '../types'
import type {ProcessedFormData, StepSubItemData} from '../steplist/types'

type SingleLabwareLiquidState = {[well: string]: StepGeneration.LocationLiquidState}

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
  form: ProcessedFormData,
  labwareId: string,
  robotState: StepGeneration.RobotState
): Array<string> {
  if (form.stepType === 'pause') {
    return []
  }

  const pipetteId = form.pipette
  // TODO Ian 2018-04-02 use robotState selectors here
  const pipetteChannels = robotState.instruments[pipetteId].channels
  const labwareType = robotState.labware[labwareId].type

  const getWells = (wells: Array<string>) => _wellsForPipette(pipetteChannels, labwareType, wells)

  let wells = []

  // If we're moving liquids within a single labware,
  // both the source and dest wells together need to be selected.
  if (form.stepType === 'transfer') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells(form.destWells))
    }
  }
  if (form.stepType === 'consolidate') {
    if (form.sourceLabware === labwareId) {
      wells.push(...getWells(form.sourceWells))
    }
    if (form.destLabware === labwareId) {
      wells.push(...getWells([form.destWell]))
    }
  }
  // TODO Ian 2018-03-23 once distribute is supported
  // if (form.stepType === 'distribute') {
  //   ...
  // }
  return wells
}

/** Scan through given substep rows to get a list of source/dest wells for the given labware */
function _getSelectedWellsForSubstep (
  form: ProcessedFormData,
  labwareId: string,
  substeps: StepSubItemData | null,
  substepId: number
): Array<string> {
  if (substeps === null) {
    return []
  }

  function getWells (wellField): Array<string> {
    if (substeps && substeps.rows && substeps.rows[substepId]) {
      // single-channel
      const well = substeps.rows[substepId][wellField]
      return well ? [well] : []
    }

    if (substeps && substeps.multiRows && substeps.multiRows[substepId]) {
      // multi-channel
      return substeps.multiRows[substepId].reduce((acc, multiRow) => {
        const well = multiRow[wellField]
        return well ? [...acc, well] : acc
      }, [])
    }
    return []
  }

  let wells: Array<string> = []
  if (form.sourceLabware && form.sourceLabware === labwareId) {
    wells.push(...getWells('sourceWell'))
  }
  if (form.destLabware && form.destLabware === labwareId) {
    wells.push(...getWells('destWell'))
  }

  return wells
}

export const wellHighlightsForSteps: Selector<Array<AllWellHighlightsAllLabware>> = createSelector(
  fileDataSelectors.robotStateTimeline,
  steplistSelectors.validatedForms,
  steplistSelectors.hoveredStepId,
  steplistSelectors.getHoveredSubstep,
  allSubsteps,
  (_robotStateTimeline, _forms, _hoveredStepId, _hoveredSubstep, _allSubsteps) => {
    function highlightedWellsForLabwareAtStep (
      labwareLiquids: SingleLabwareLiquidState,
      labwareId: string,
      robotState: StepGeneration.RobotState,
      form: ProcessedFormData,
      formIdx: number
    ): AllWellHighlights {
      let selectedWells: Array<string> = []
      if (form && _hoveredStepId === formIdx) {
        // only show selected wells when user is **hovering** over the step
        if (_hoveredSubstep) {
          // wells for hovered substep
          selectedWells = _getSelectedWellsForSubstep(
            form,
            labwareId,
            _allSubsteps[_hoveredSubstep.stepId],
            _hoveredSubstep.substepId
          )
        } else {
          // wells for step overall
          selectedWells = _getSelectedWellsForStep(form, labwareId, robotState)
        }
      }

      // return selected wells eg {A1: true, B4: true}
      return selectedWells.reduce((acc, well) => ({...acc, [well]: true}), {})
    }

    function highlightedWellsForTimelineFrame (liquidState, timelineIdx): AllWellHighlightsAllLabware {
      const robotState = _robotStateTimeline[timelineIdx].robotState
      const formIdx = timelineIdx + 1 // add 1 to make up for initial deck setup action
      const form = _forms[formIdx] && _forms[formIdx].validatedForm

      // replace value of each labware with highlighted wells info
      return mapValues(
        liquidState,
        (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => (form)
          ? highlightedWellsForLabwareAtStep(
            labwareLiquids,
            labwareId,
            robotState,
            form,
            formIdx
          )
        : {} // no form -> no highlighted wells
      )
    }

    const liquidStateTimeline = _robotStateTimeline.map(t => t.robotState.liquidState.labware)
    return liquidStateTimeline.map(highlightedWellsForTimelineFrame)
  }
)
