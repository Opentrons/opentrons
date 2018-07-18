// @flow

export const addHint = (hint: HintKey) => ({
  type: 'ADD_HINT',
  payload: {hint}
})

export const dequeueHint = () => ({
  type: 'REMOVE_HINT'
})
