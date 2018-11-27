// @flow
import each from 'lodash/each'
import isEmpty from 'lodash/isEmpty'

import type {Mount} from '@opentrons/components'
import {selectors as steplistSelectors, actions as steplistActions} from '../steplist'
import {reconcileFormPipette} from '../steplist/actions/handleFormChange'
import type {PipetteFields} from '../load-file'
import type {PipetteData} from '../step-generation'
import {selectors as pipetteSelectors} from '../pipettes'
import type {ThunkDispatch, GetState} from '../types'
import {updatePipettes} from './actions'
import type {EditPipettesFields, PipettesByMount} from './types'
import {createPipette} from './utils'

// TODO: BC 2018-10-24 this thunk exists because of the extra work our pipette
// reducer is doing on pipette creation. We need other reducers to receive the
// derived pipette object, so we create it here and send it out to be wholly
// swapped in by the pipette reducer, and observed by other dependent
// reducers (e.g. steplist savedForms). In the future, the createPipette logic should
// probably happen before the initial action is dispatched, in the form or mapDispatchToProps

export const editPipettes = (payload: EditPipettesFields) =>
  (dispatch: ThunkDispatch<*>, getState: GetState) => {
    const state = getState()
    const prevPipettesByMount = pipetteSelectors.getPipettesByMount(state)
    const savedForms = steplistSelectors.getSavedForms(state)

    const nextPipettesByMount: PipettesByMount = Object.keys(payload).reduce(
      (acc: PipettesByMount, mount: Mount): PipettesByMount => {
        const pipetteFields: PipetteFields = payload[mount]
        const nextPipetteModel = pipetteFields.pipetteModel
        const nextTiprackModel = isEmpty(pipetteFields.tiprackModel) ? null : pipetteFields.tiprackModel
        const nextPipette: ?PipetteData = nextPipetteModel ? createPipette(mount, nextPipetteModel, nextTiprackModel) : null
        return nextPipette ? {...acc, [mount]: nextPipette} : acc
      },
      {}
    )

    // NOTE: this clears out currently selected step form so that we're only updating savedForms
    dispatch(steplistActions.cancelStepForm())

    each(nextPipettesByMount, (nextPipette, mount) => {
      const prevPipette = prevPipettesByMount[mount]
      if ((prevPipette && prevPipette.id) !== (nextPipette && nextPipette.id)) {
        each(savedForms, (formData, stepId) => {
          if (formData.pipette === (prevPipette && prevPipette.id)) {
            dispatch(steplistActions.changeSavedStepForm({
              stepId,
              update: {
                ...reconcileFormPipette(
                  formData,
                  state,
                  (nextPipette && nextPipette.id),
                  (nextPipette && nextPipette.channels)
                ),
                pipette: nextPipette ? nextPipette.id : null,
              },
            }))
          }
        })
      }
    })

    dispatch(updatePipettes(nextPipettesByMount))
  }
