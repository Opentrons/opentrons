// @flow
import { _allReducers } from '../reducers'
import { PRESAVED_STEP_FORM_PSUDO_ID } from '../constants'
const { dismissedWarnings } = _allReducers

let initialState

beforeEach(() => {
  initialState = { form: {}, timeline: {} }
})

describe('dismissedWarnings reducer', () => {
  it('should remember a dismissed form-level warning', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_FORM_WARNING',
      payload: {
        type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
        stepId: 'someStepId',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: { someStepId: ['BELOW_PIPETTE_MINIMUM_VOLUME'] },
      timeline: {},
    })
  })

  it('should remember a dismissed form-level warning for an unsaved form', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_FORM_WARNING',
      payload: {
        type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
        stepId: null, // no stepId
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: { [PRESAVED_STEP_FORM_PSUDO_ID]: ['BELOW_PIPETTE_MINIMUM_VOLUME'] },
      timeline: {},
    })
  })

  it('should remember a dismissed timeline-level warning', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_TIMELINE_WARNING',
      payload: {
        type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
        stepId: 'someStepId',
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: {},
      timeline: { someStepId: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'] },
    })
  })

  it('should remember a dismissed timeline-level warning for an unsaved form', () => {
    const state = initialState
    const action = {
      type: 'DISMISS_TIMELINE_WARNING',
      payload: {
        type: 'ASPIRATE_MORE_THAN_WELL_CONTENTS',
        stepId: null, // no stepId
      },
    }
    expect(dismissedWarnings(state, action)).toEqual({
      form: {},
      timeline: {
        [PRESAVED_STEP_FORM_PSUDO_ID]: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'],
      },
    })
  })

  it('should forget all warnings for a form upon DELETE_STEP', () => {
    const state = {
      form: {
        otherStepId: ['whatever_form'],
        someStepId: ['BELOW_PIPETTE_MINIMUM_VOLUME'],
      },
      timeline: {
        otherStepId: ['whatever_timeline'],
        someStepId: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'],
      },
    }

    const action = {
      type: 'DELETE_STEP',
      payload: 'someStepId',
    }

    expect(dismissedWarnings(state, action)).toEqual({
      form: { otherStepId: ['whatever_form'] },
      timeline: { otherStepId: ['whatever_timeline'] },
    })
  })

  it('should forget all warnings for an unsaved form upon CANCEL_STEP_FORM', () => {
    const state = {
      form: {
        otherStepId: ['whatever_form'],
        [PRESAVED_STEP_FORM_PSUDO_ID]: ['BELOW_PIPETTE_MINIMUM_VOLUME'],
      },
      timeline: {
        otherStepId: ['whatever_timeline'],
        [PRESAVED_STEP_FORM_PSUDO_ID]: ['ASPIRATE_MORE_THAN_WELL_CONTENTS'],
      },
    }
    const action = {
      type: 'CANCEL_STEP_FORM',
      payload: null,
    }

    expect(dismissedWarnings(state, action)).toEqual({
      form: { otherStepId: ['whatever_form'] },
      timeline: { otherStepId: ['whatever_timeline'] },
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
                form: { someStepId: ['whatever_form'] },
                timeline: { someStepId: ['whatever_timeline'] },
              },
            },
          },
        },
      },
    }
    expect(dismissedWarnings(initialState, action)).toEqual({
      form: { someStepId: ['whatever_form'] },
      timeline: { someStepId: ['whatever_timeline'] },
    })
  })
})
