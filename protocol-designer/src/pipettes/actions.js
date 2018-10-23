// @flow

export const swapPipettes = () => ({
  type: 'SWAP_PIPETTES',
})

export const editPipettes = (payload: EditPipetteFields) => ({
  type: 'EDIT_PIPETTES',
  payload,
})
