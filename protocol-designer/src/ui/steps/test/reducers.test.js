// @flow
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
  it('select step', () => {
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

  it('select terminal item', () => {
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
})
