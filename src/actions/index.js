import { createActions } from 'redux-actions'

console.log({createActions})

export const { openLabwareDropdown, closeLabwareDropdown, selectLabwareToAdd } = createActions({
  OPEN_LABWARE_DROPDOWN: undefined,
  CLOSE_LABWARE_DROPDOWN: undefined,

  SELECT_LABWARE_TO_ADD: undefined
})
