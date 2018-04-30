// @flow
import {createSelector} from 'reselect'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import type {BaseState, Selector} from '../../types'
import * as StepGeneration from '../../step-generation'
import {selectors as steplistSelectors} from '../../steplist/reducers'
import {equippedPipettes} from './pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {IngredInstance} from '../../labware-ingred/types'

const all96Tips = reduce( // TODO Ian 2018-04-05 mapValues
  StepGeneration.tiprackWellNamesFlat,
  (acc: {[string]: boolean}, wellName: string) => ({...acc, [wellName]: true}),
  {}
)

type LiquidState = $PropertyType<StepGeneration.RobotState, 'liquidState'>
type LabwareLiquidState = $PropertyType<LiquidState, 'labware'>

/** getLabwareLiquidState reshapes data from labwareIngreds.ingredLocations reducer
  * to match RobotState.liquidState.labware's shape
  */
export const getLabwareLiquidState: Selector<LabwareLiquidState> = createSelector(
  labwareIngredSelectors.getLabware,
  labwareIngredSelectors.getIngredientLocations,
  (labware, ingredLocs) => {
    const allLabwareIds = Object.keys(labware)

    type WellVolume = {volume: number}

    function getAllIngredsForLabware (labwareId: string) {
      return reduce(ingredLocs, (ingredAcc: {[wellName: string]: WellVolume}, ingredGroupData: IngredInstance, ingredGroupId: string) => {
        return {
          ...ingredAcc,
          ...reduce(ingredGroupData[labwareId], (wellAcc, wellData: WellVolume, wellName: string) => ({
            ...wellAcc,
            [wellName]: {
              ...ingredAcc[wellName],
              [ingredGroupId]: wellData
            }
          }), {})
        }
      }, {})
    }
    return allLabwareIds.reduce((acc, labwareId) => ({
      ...acc,
      [labwareId]: getAllIngredsForLabware(labwareId)
    }), {})
  }
)

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  equippedPipettes,
  labwareIngredSelectors.getLabware,
  getLabwareLiquidState,
  (pipettes, labware, labwareLiquidState) => {
    type TipState = $PropertyType<StepGeneration.RobotState, 'tipState'>
    type TiprackTipState = $PropertyType<TipState, 'tipracks'>

    const tipracks: TiprackTipState = reduce(
      labware,
      (acc: TiprackTipState, labwareData: StepGeneration.LabwareData, labwareId: string) => {
        if (labwareData.type.startsWith('tiprack')) {
          return {
            ...acc,
            [labwareId]: all96Tips
          }
        }
        return acc
      },
      {})

    type PipetteTipState = {[pipetteId: string]: boolean}
    const pipetteTipState: PipetteTipState = reduce(
      pipettes,
      (acc: PipetteTipState, pipetteData: StepGeneration.PipetteData) =>
        ({
          ...acc,
          [pipetteData.id]: false // start with no tips
        }),
      {})

    const pipetteLiquidState = reduce(
      pipettes,
      (acc, pipetteData: StepGeneration.PipetteData, pipetteId: string) => ({
        ...acc,
        [pipetteId]: (pipetteData.channels > 1)
          ? {'0': {}, '1': {}, '2': {}, '3': {}, '4': {}, '5': {}, '6': {}, '7': {}}
          : {'0': {}}
      }),
    {})

    return {
      instruments: pipettes,
      labware,
      tipState: {
        tipracks,
        pipettes: pipetteTipState
      },
      liquidState: {
        pipettes: pipetteLiquidState,
        labware: labwareLiquidState
      }
    }
  }
)

type RobotStateTimelineAcc = {
  formErrors: {[string]: string},
  timeline: Array<StepGeneration.CommandsAndRobotState>,
  robotState: StepGeneration.RobotState,
  timelineErrors?: ?Array<StepGeneration.CommandCreatorError>
}

export const robotStateTimeline: BaseState => Array<StepGeneration.CommandsAndRobotState> = createSelector(
  steplistSelectors.validatedForms,
  steplistSelectors.orderedSteps,
  getInitialRobotState,
  (forms, orderedSteps, initialRobotState) => {
    const result = orderedSteps.reduce((acc: RobotStateTimelineAcc, stepId): RobotStateTimelineAcc => {
      if (!isEmpty(acc.formErrors)) {
        // short-circut the reduce if there were errors with validating / processing the form
        return acc
      }

      if (acc.timelineErrors) {
        // short-circut the reduce if there were timeline errors
        return acc
      }

      const form = forms[stepId]

      if (stepId === 0) {
        // The first stepId is the "initial deck setup" step.
        // It doesn't have a form, it just sets up initialRobotState
        return {
          ...acc,
          timeline: [
            ...acc.timeline,
            {
              commands: [],
              robotState: initialRobotState
            }
          ]
        }
      }

      // put form errors into accumulator
      if (!form.validatedForm) {
        return {
          ...acc,
          formErrors: form.errors
        }
      }

      // finally, deal with valid step forms
      let nextCommandsAndState

      if (form.validatedForm.stepType === 'consolidate') {
        nextCommandsAndState = StepGeneration.consolidate(form.validatedForm)(acc.robotState)
      }
      if (form.validatedForm.stepType === 'transfer') {
        nextCommandsAndState = StepGeneration.transfer(form.validatedForm)(acc.robotState)
      }

      if (!nextCommandsAndState) {
        // TODO implement the remaining steps
        return {
          ...acc,
          formErrors: {
            ...acc.formErrors,
            'STEP NOT IMPLEMENTED': form.validatedForm.stepType
          }
        }
      }

      // for supported steps
      if (nextCommandsAndState.errors) {
        return {
          ...acc,
          timelineErrors: nextCommandsAndState.errors
        }
      }
      return {
        ...acc,
        timeline: [...acc.timeline, nextCommandsAndState],
        robotState: nextCommandsAndState.robotState
      }
    }, {formErrors: {}, timeline: [], robotState: initialRobotState, timelineErrors: null})
    // TODO Ian 2018-03-01 pass along name and description of steps for command annotations in file

    if (!isEmpty(result.formErrors)) {
      // TODO Ian 2018-03-01 remove log later
      console.log('Got form errors while constructing timeline', result)
    }

    if (result.timelineErrors) {
      // TODO Ian 2018-04-30 remove log later
      console.log('Got timeline errors', result)
    }

    return result.timeline
  }
)
