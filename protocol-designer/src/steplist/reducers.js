import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { createSelector } from 'reselect'

import type {StepType} from './types'

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

type AddStepType = {
  stepType: StepType,
  id: number
}

export function createDefaultStep (payload: AddStepType) {
  const {stepType} = payload
  return {...payload, title: stepType}
}

const steps = handleActions({
  ADD_STEP: (state, action) => ({
    ...state,
    [action.payload.id]: createDefaultStep(action.payload)
  })
}, {})

// Payload is ID. TODO: type that
const collapsedSteps = handleActions({
  ADD_STEP: (state, action) => ({...state, [action.payload]: false}),
  TOGGLE_STEP_COLLAPSED: (state, action) => ({
    ...state,
    [action.payload]: !state[action.payload]
  })
}, {})

const orderedSteps = handleActions({
  ADD_STEP: (state, action) => [...state, action.payload.id]
}, [])

const selectedStep = handleActions({
  ADD_STEP: (state, action) => action.payload.id,
  SELECT_STEP: (state, action) => action.payload
}, null)

const stepCreationButtonExpanded = handleActions({
  ADD_STEP: () => false,
  EXPAND_ADD_STEP_BUTTON: (state, action) => action.payload
}, false)

const rootReducer = combineReducers({
  steps,
  collapsedSteps,
  orderedSteps,
  selectedStep,
  stepCreationButtonExpanded
})

const rootSelector = state => state.steplist // TODO LATER

export const selectors = {
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    state => state.stepCreationButtonExpanded
  ),
  allSteps: createSelector(
    state => rootSelector(state).steps,
    state => rootSelector(state).orderedSteps,
    state => rootSelector(state).collapsedSteps,
    (steps, orderedSteps, collapsedSteps) => orderedSteps.map(id => ({
      ...steps[id],
      collapsed: collapsedSteps[id]
    }))
  ),
  selectedStepId: createSelector(
    rootSelector,
    state => state.selectedStep
  )
}

export default rootReducer
