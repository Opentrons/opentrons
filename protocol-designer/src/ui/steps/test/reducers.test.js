// @flow
import { PRESAVED_STEP_ID } from '../../../steplist/types'
import { _allReducers } from '../reducers.js'

jest.mock('../../../labware-defs/utils')

const { collapsedSteps, selectedItem } = _allReducers

describe('collapsedSteps reducer', () => {
  it('should add a collapsed step when a new step is saved for the first time', () => {
    const state = { '1': true, '2': false }
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: { id: '3' },
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': true,
      '2': false,
      '3': false,
    })
  })
  it('should not update when an existing step form is saved', () => {
    const state = { '1': true, '2': false }
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: { id: '1' },
    }
    expect(collapsedSteps(state, action)).toBe(state)
  })
  it('should toggle step on->off upon TOGGLE_STEP_COLLAPSED', () => {
    const state = {
      '1': true,
      '2': false,
      '3': true,
      '4': true,
    }
    const action = {
      type: 'TOGGLE_STEP_COLLAPSED',
      payload: '3',
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': true,
      '2': false,
      '3': false,
      '4': true,
    })
  })

  it('should toggle step off-> on upon TOGGLE_STEP_COLLAPSED', () => {
    const state = {
      '1': true,
      '2': false,
      '3': true,
      '4': true,
    }
    const action = {
      type: 'TOGGLE_STEP_COLLAPSED',
      payload: '2',
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': true,
      '2': true,
      '3': true,
      '4': true,
    })
  })
})

describe('selectedItem reducer', () => {
  it('should select the presaved step item on ADD_STEP', () => {
    const action = {
      type: 'ADD_STEP',
      payload: PRESAVED_STEP_ID,
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: false,
      id: PRESAVED_STEP_ID,
    })
  })

  it('should select the saved step item on SAVE_STEP_FORM', () => {
    const stepId = '123'
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: { id: stepId },
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: true,
      id: stepId,
    })
  })

  it('should select the given step on SELECT_STEP', () => {
    const stepId = '123'
    const action = {
      type: 'SELECT_STEP',
      payload: stepId,
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: true,
      id: stepId,
    })
  })

  it('should select the given select terminal item on SELECT_TERMINAL_ITEM', () => {
    const terminalId = 'test'
    const action = {
      type: 'SELECT_TERMINAL_ITEM',
      payload: terminalId,
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: false,
      id: terminalId,
    })
  })

  it('should deselect on DELETE_STEP', () => {
    const action = {
      type: 'DELETE_STEP',
      payload: 'someStepId',
    }
    expect(selectedItem({ isStep: true, id: 'anyId' }, action)).toEqual(null)
  })
})
