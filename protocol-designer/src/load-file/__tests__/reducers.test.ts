import { describe, it, expect } from 'vitest'
import { _allReducers } from '../reducers'

const { unsavedChanges } = _allReducers
describe('unsavedChanges', () => {
  it('should return true when an action changes the protocol', () => {
    const actionTypes = [
      'CREATE_NEW_PROTOCOL',
      'DISMISS_FORM_WARNING',
      'DISMISS_TIMELINE_WARNING',
      'CREATE_CONTAINER',
      'DELETE_CONTAINER',
      'CHANGE_SAVED_STEP_FORM',
      'DUPLICATE_LABWARE',
      'MOVE_DECK_ITEM',
      'RENAME_LABWARE',
      'DELETE_LIQUID_GROUP',
      'EDIT_LIQUID_GROUP',
      'REMOVE_WELLS_CONTENTS',
      'SET_WELL_CONTENTS',
      'ADD_STEP',
      'DELETE_STEP',
      'DELETE_MULTIPLE_STEPS',
      'SAVE_STEP_FORM',
      'SAVE_FILE_METADATA',
      'REPLACE_CUSTOM_LABWARE_DEF',
      'CREATE_MODULE',
      'DELETE_MODULE',
      'EDIT_MODULE',
    ]
    expect.assertions(actionTypes.length)
    actionTypes.forEach(actionType => {
      expect(
        unsavedChanges(false, {
          type: actionType,
          payload: 'does not matter',
        })
      ).toBe(true)
    })
  })
  it('should return false when saving a step', () => {
    expect(
      unsavedChanges(true, {
        type: 'SAVE_PROTOCOL_FILE',
        payload: 'does not matter',
      })
    ).toBe(false)
  })
  describe('when loading a file', () => {
    it('should return false if it did NOT migrate', () => {
      expect(
        unsavedChanges(true, {
          type: 'LOAD_FILE',
          payload: {
            didMigrate: false,
          },
        })
      ).toBe(false)
    })
    it('should return true if it did migrate', () => {
      expect(
        unsavedChanges(false, {
          type: 'LOAD_FILE',
          payload: {
            didMigrate: true,
          },
        })
      ).toBe(true)
    })
  })
})
