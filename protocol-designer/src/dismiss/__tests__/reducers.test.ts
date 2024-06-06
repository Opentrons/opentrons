import { describe, it, expect, beforeEach } from 'vitest'
import { _allReducers } from '../reducers'
import type { DismissedWarningState } from '../reducers'

const { dismissedWarnings } = _allReducers

let initialState: DismissedWarningState

beforeEach(() => {
  initialState = { form: [], timeline: [] }
})

describe('dismissedWarnings reducer', () => {
  it('should remember a dismissed form-level warning', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_FORM_WARNING',
      payload: {
        type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: ['BELOW_PIPETTE_MINIMUM_VOLUME'],
      timeline: [],
    })
  })

  it('should remember a dismissed form-level warning for an unsaved form', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_FORM_WARNING',
      payload: {
        type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: ['BELOW_PIPETTE_MINIMUM_VOLUME'],
      timeline: [],
    })
  })

  it('should remember a dismissed timeline-level warning', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_TIMELINE_WARNING',
      payload: {
        type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: [],
      timeline: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'],
    })
  })

  it('should remember a dismissed timeline-level warning for an unsaved form', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_TIMELINE_WARNING',
      payload: {
        type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: [],
      timeline: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'],
    })
  })

  it('should reconstitute dismissed warnings from the metadata of a loaded PD file', () => {
    const action = {
      type: 'LOAD_FILE',
      payload: {
        file: {
          designerApplication: {
            name: 'opentrons/protocol-designer',
            version: '5.0.1',
            data: {
              dismissedWarnings: {
                form: ['whatever_form'],
                timeline: ['whatever_timeline'],
              },
            },
          },
        },
      },
    }
    expect(dismissedWarnings(initialState, action)).toEqual({
      form: ['whatever_form'],
      timeline: ['whatever_timeline'],
    })
  })
})
