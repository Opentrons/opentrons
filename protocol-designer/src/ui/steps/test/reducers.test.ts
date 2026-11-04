import { describe, expect, it, vi } from 'vitest'

import { PRESAVED_STEP_ID } from '../../../steplist/types'
import {
  _allReducers,
  MULTI_STEP_SELECTION_TYPE,
  SINGLE_STEP_SELECTION_TYPE,
  TERMINAL_ITEM_SELECTION_TYPE,
} from '../reducers'

import type { FormData } from '/protocol-designer/form-types'
import type { SelectMultipleStepsAction } from '../actions/types'
import type { SelectableItem } from '../reducers'

vi.mock('../../../labware-defs/utils')

const { selectedItem } = _allReducers

describe('selectedItem reducer', () => {
  it('should select the presaved step item on ADD_STEP', () => {
    const action = {
      type: 'ADD_STEP',
      payload: PRESAVED_STEP_ID,
    }
    expect(selectedItem(null, action)).toEqual({
      selectionType: TERMINAL_ITEM_SELECTION_TYPE,
      id: PRESAVED_STEP_ID,
    })
  })

  it('should select the saved step item on SAVE_STEP_FORM', () => {
    const stepId = '123'
    const action = {
      type: 'SAVE_STEP_FORM',
      payload: {
        form: { id: stepId } as FormData,
        thermocyclerPauseStepId: 'tc-pause',
        vacuumPauseStepId: 'vac-pause',
      },
    }
    expect(selectedItem(null, action)).toEqual({
      selectionType: SINGLE_STEP_SELECTION_TYPE,
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
      selectionType: SINGLE_STEP_SELECTION_TYPE,
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
      selectionType: TERMINAL_ITEM_SELECTION_TYPE,
      id: terminalId,
    })
  })

  it('should clear selected item on CLEAR_SELECTED_ITEM', () => {
    const action = {
      type: 'CLEAR_SELECTED_ITEM',
    }
    expect(selectedItem(null, action)).toBe(null)
  })

  describe('multi-step selection', () => {
    const stepIds = ['someStepId', 'anotherStepId']
    const lastSelected = 'anotherStepId'
    const action: SelectMultipleStepsAction = {
      type: 'SELECT_MULTIPLE_STEPS',
      payload: { stepIds, lastSelected },
    }
    const multiTestCases: Array<{
      title: string
      prev: SelectableItem | null
      action: SelectMultipleStepsAction
      expected: SelectableItem | null
    }> = [
      {
        title: 'should enter multi-select mode from null',
        prev: null,
        action,
        expected: {
          selectionType: MULTI_STEP_SELECTION_TYPE,
          ids: stepIds,
          lastSelected,
        },
      },
      {
        title: 'should enter multi-select mode from multi-select',
        // @ts-expect-error(sa, 2021-6-17): missing lastSelected is to be of type MultipleSelectedItem
        prev: {
          selectionType: MULTI_STEP_SELECTION_TYPE,
          ids: ['notTheseSteps', 'nope'],
        },
        action,
        expected: {
          selectionType: MULTI_STEP_SELECTION_TYPE,
          ids: stepIds,
          lastSelected,
        },
      },
      {
        title: 'should enter multi-select mode from single-selected step',
        prev: {
          selectionType: SINGLE_STEP_SELECTION_TYPE,
          id: 'notThisId',
        },
        action,
        expected: {
          selectionType: MULTI_STEP_SELECTION_TYPE,
          ids: stepIds,
          lastSelected,
        },
      },
      {
        title:
          'should enter multi-select mode from single-selected terminal item',
        prev: {
          selectionType: TERMINAL_ITEM_SELECTION_TYPE,
          // @ts-expect-error(sa, 2021-6-17): not a valid TerminalItemId
          id: 'someTerminalItem',
        },
        action,
        expected: {
          selectionType: MULTI_STEP_SELECTION_TYPE,
          ids: stepIds,
          lastSelected,
        },
      },
    ]
    multiTestCases.forEach(({ title, prev, action, expected }) => {
      it(title, () => {
        expect(selectedItem(prev, action)).toEqual(expected)
      })
    })
  })
})
