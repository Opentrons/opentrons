// addStep thunk adds an incremental integer ID for Step reducers.
let stepIdCounter = 0
export const addStep = payload => (dispatch, getState) => {
  dispatch({
    type: 'ADD_STEP',
    payload: {
      ...payload,
      id: stepIdCounter
    }
  })
  stepIdCounter += 1
}

export const expandAddStepButton = ({type: 'EXPAND_ADD_STEP_BUTTON', payload: null})
