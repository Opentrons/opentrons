// @flow

export const addHint = (hint: HintKey) => ({
  type: 'ADD_HINT',
  payload: {hint}
})

export const removeHint = (hint: HintKey) => ({
  type: 'REMOVE_HINT',
  payload: {hint}
})
