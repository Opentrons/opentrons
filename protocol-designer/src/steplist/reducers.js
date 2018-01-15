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
  EXPAND_ADD_STEP_BUTTON: () => true
}, false)

const rootReducer = combineReducers({
  steps,
  orderedSteps,
  selectedStep,
  stepCreationButtonExpanded
})

const rootSelector = state => state.steplist // TODO

export const selectors = {
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    state => state.stepCreationButtonExpanded
  )
}

export default rootReducer
