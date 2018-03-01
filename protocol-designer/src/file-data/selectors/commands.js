// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import type {BaseState} from '../../types'
import * as StepGeneration from '../../step-generation'
import {selectors as steplistSelectors} from '../../steplist/reducers'
import {selectors as fileDataSelectors} from '../../file-data'

const all96Tips = reduce(
  StepGeneration.tiprackWellNamesFlat,
  (acc: {[string]: boolean}, wellName: string) => ({...acc, [wellName]: true}),
  {}
)

export const getInitialRobotState: BaseState => StepGeneration.RobotState = createSelector(
  base => base,
  (s: BaseState) => {
    const pipettes = fileDataSelectors.equippedPipettes(s)
    const labware = s.labwareIngred.containers // TODO IMMEDIATELY use selector

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

    return {
      instruments: pipettes,
      labware,
      tipState: {
        tipracks,
        pipettes: pipetteTipState
      }
    }
  }
)

export const commands = (state: BaseState): Array<StepGeneration.Command> | 'ERROR COULD NOT GENERATE COMMANDS (TODO)' => {
  // TODO use existing selectors, don't rewrite!!!
  const forms = steplistSelectors.validatedForms(state)

  // Skip the first step in orderedSteps -- it's the initial deck setup.
  const orderedNonDeckSteps = steplistSelectors.rootSelector(state).orderedSteps.slice(1)

  // don't try to make commands if the step forms are null or if there are any errors.
  const someStepsInvalid = orderedNonDeckSteps.some(stepId =>
    forms[stepId].validatedForm === null)

  if (someStepsInvalid) {
    return 'ERROR COULD NOT GENERATE COMMANDS (TODO)'
  }

  // TODO this should be its own selector
  const initialRobotState = getInitialRobotState(state)

  const consolidateExample = forms && forms[1] && forms[1].validatedForm

  if (orderedNonDeckSteps && consolidateExample && consolidateExample.stepType === 'consolidate') {
    return StepGeneration.consolidate(consolidateExample)(initialRobotState).commands
  }

  console.warn('DEBUG: no consolidateExample')
  return 'ERROR COULD NOT GENERATE COMMANDS (TODO)'

  // TODO reduce ALL steps

  // return orderedSteps && flatMap(orderedSteps, (stepId): Array<Command> => {
  //   const formDataAndErrors = forms[stepId]
  //   if (!formDataAndErrors || formDataAndErrors.validatedForm === null) {
  //     throw new Error('validatedForm should not be null here') // for flow only, should be fully handled above
  //   }
  //   // BLAH
  // })
}
