// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import { createSelector } from 'reselect'

import type {StepItemData, StepIdType} from './types'
import type {AddStepAction} from './actions' // Thunk action creators
import {expandAddStepButton, selectStep, toggleStepCollapsed} from './actions'

// TODO move to test
/*
const initialSteps = {
  0: {
    title: 'Transfer X',
    stepType: 'transfer',
    sourceLabwareName: 'X Plate',
    sourceWell: 'X2',
    destLabwareName: 'Dest X',
    destWell: 'Y2',
    id: 0,
    collapsed: false,
    substeps: [
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'B1',
        destIngredientName: 'ddH2O',
        destWell: 'B2'
      },
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'C1',
        destIngredientName: 'ddH2O',
        destWell: 'C2'
      },
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'D1',
        destIngredientName: 'ddH2O',
        destWell: 'D2'
      }
    ]
  },
  2: {
    title: 'Pause 1',
    stepType: 'pause',
    id: 2
  },
  3: {
    title: 'Distribute X',
    description: 'Description is here',
    stepType: 'distribute',
    sourceLabwareName: 'X Plate',
    destLabwareName: 'Dest X',
    id: 3,
    substeps: [
      {
        sourceIngredientName: 'LB',
        sourceWell: 'A1',
        destIngredientName: 'ddH2O',
        destWell: 'B1'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B2'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B3'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B4'
      }
    ]
  },
  4: {
    title: 'Pause 2',
    stepType: 'pause',
    id: 4,
    description: 'Wait until operator adds new tip rack.'
  },
  5: {
    title: 'Consolidate X',
    stepType: 'consolidate',
    sourceLabwareName: 'Labware A',
    destLabwareName: 'Labware B',
    id: 5,
    substeps: [
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A1'
      },
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A2'
      },
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A3',
        destIngredientName: 'LB Broth',
        destWell: 'H1'
      }
    ]
  }
}

const initialStepOrder = [0, 2, 3, 4, 5]
*/

// Add default title (and later, other default values) to newly-created Step
export function createDefaultStep (action: AddStepAction) {
  const {stepType} = action.payload
  return {...action.payload, title: stepType}
}

type StepsState = {[StepIdType]: StepItemData}

const steps = handleActions({
  ADD_STEP: (state, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: createDefaultStep(action)
  })
}, {})

type CollapsedStepsState = {
  [StepIdType]: boolean
}

const collapsedSteps = handleActions({
  ADD_STEP: (state: CollapsedStepsState, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: false
  }),
  TOGGLE_STEP_COLLAPSED: (state: CollapsedStepsState, {payload}: ActionType<typeof toggleStepCollapsed>) => ({
    ...state,
    [payload]: !state[payload]
  })
}, {})

type OrderedStepsState = Array<StepIdType>

const orderedSteps = handleActions({
  ADD_STEP: (state: OrderedStepsState, action: AddStepAction) =>
    [...state, action.payload.id]
}, [])

type SelectedStepState = null | StepIdType

const selectedStep = handleActions({
  ADD_STEP: (state: SelectedStepState, action: AddStepAction) => action.payload.id,
  SELECT_STEP: (state: SelectedStepState, {payload}: ActionType<typeof selectStep>) => payload
}, null)

type StepCreationButtonExpandedState = boolean

const stepCreationButtonExpanded = handleActions({
  ADD_STEP: () => false,
  EXPAND_ADD_STEP_BUTTON: (
    state: StepCreationButtonExpandedState,
    {payload}: ActionType<typeof expandAddStepButton>
  ) =>
    payload
}, false)

export type RootState = {
  steps: StepsState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedStep: SelectedStepState,
  stepCreationButtonExpanded: StepCreationButtonExpandedState
}

const rootReducer = combineReducers({
  steps,
  collapsedSteps,
  orderedSteps,
  selectedStep,
  stepCreationButtonExpanded
})

// TODO: Rethink the hard-coded 'steplist' key in Redux root
type BaseState = {steplist: RootState}
const rootSelector = (state: BaseState): RootState => state.steplist

export const selectors = {
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    (state: RootState) => state.stepCreationButtonExpanded
  ),
  allSteps: createSelector(
    (state: BaseState) => rootSelector(state).steps,
    (state: BaseState) => rootSelector(state).orderedSteps,
    (state: BaseState) => rootSelector(state).collapsedSteps,
    (steps, orderedSteps, collapsedSteps) => orderedSteps.map(id => ({
      ...steps[id],
      collapsed: collapsedSteps[id]
    }))
  ),
  selectedStepId: createSelector(
    rootSelector,
    (state: RootState) => state.selectedStep
  )
}

export default rootReducer
