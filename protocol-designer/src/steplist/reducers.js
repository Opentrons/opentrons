import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { createSelector } from 'reselect'

const steps = handleActions({
  ADD_STEP: (state, action) => ({...state, [action.payload.id]: action.payload})
}, {})

const orderedSteps = handleActions({
  ADD_STEP: (state, action) => [...state, action.payload.id]
}, [])

const selectedStep = handleActions({
  ADD_STEP: (state, action) => action.payload.id
}, null)

const stepCreationButtonExpanded = handleActions({
  ADD_STEP: () => false,
  EXPAND_ADD_STEP_BUTTON: (state, action) => action.payload
}, false)

const rootReducer = combineReducers({
  steps,
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
    (steps, orderedSteps) => orderedSteps.map(id => steps[id])
  ),
  selectedStep: createSelector(
    state => rootReducer(state).selectedStep
  )
}

export default rootReducer
