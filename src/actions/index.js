import { createActions } from 'redux-actions'

console.log({createActions})

export const { openLabwareSelector, closeLabwareSelector, selectLabwareToAdd } = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  SELECT_LABWARE_TO_ADD: undefined
})
