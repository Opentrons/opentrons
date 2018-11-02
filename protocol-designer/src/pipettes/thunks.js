// @flow
import each from 'lodash/each'
import findKey from 'lodash/findKey'

import {selectors as steplistSelectors, actions as steplistActions} from '../steplist'
import {reconcileFormPipette} from '../steplist/actions/handleFormChange'
import {selectors as pipetteSelectors} from '../pipettes'
import type {ThunkDispatch, GetState} from '../types'
import {updatePipettes} from './actions'
import {createPipette} from './utils'
import type {EditPipettesFields} from './types'

// TODO: BC 2018-10-24 this thunk exists because of the extra work our pipette
// reducer is doing on pipette creation. We need other reducers to receive the
// derived pipette object, so we create it here and send it out to be wholly
// swapped in by the pipette reducer, and observed by other dependent
// reducers (e.g. steplist savedForms). In the future, the createPipette logic should
// probably happen before the initial action is dispatched, in the form or mapDispatchToProps

export const editPipettes = (payload: EditPipettesFields) =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const prevPipettesByMount = pipetteSelectors.pipettesByMount(state)
    const savedForms = steplistSelectors.getSavedForms(state)

    const {left: nextLeft, right: nextRight} = payload
    const nextPipettesByMount = {
      left: nextLeft.pipetteModel ? createPipette('left', nextLeft.pipetteModel, nextLeft.tiprackModel) : {},
      right: nextRight.pipetteModel ? createPipette('right', nextRight.pipetteModel, nextRight.tiprackModel) : {},
    }

    each(nextPipettesByMount, (nextPipette, mount) => {
      const prevPipette = prevPipettesByMount[mount]
      if (prevPipette && prevPipette.id !== nextPipette.id) {
        each(savedForms, (formData, stepId) => {
          if (formData.pipette === prevPipette.id) {
            dispatch(steplistActions.changeSavedStepForm({
              stepId,
              update: {
                ...reconcileFormPipette(formData, state, nextPipette.id, nextPipette.nextChannels),
                pipette: nextPipette.id || null,
              },
            }))
          }
        })
      }
    })

    dispatch(updatePipettes(nextPipettesByMount))
  }
