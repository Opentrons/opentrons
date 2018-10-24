// @flow
import pickBy from 'lodash/pickBy'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import each from 'lodash/each'
import findKey from 'lodash/findKey'

import {selectors as steplistSelectors, actions as steplistActions} from '../steplist'
import {reconcileFormPipette} from '../steplist/actions/handleFormChange'
import {selectors as pipetteSelectors} from '../pipettes'
import {createNewPipettesSlice} from './utils'

// TODO: BC 2018-10-24 this thunk exists because of the extra work our pipette
// reducer is doing on pipette creation. We need other reducers to receive the
// derived pipette object, so we create it here and send it out to be wholly
// swapped in by the pipette reducer, and observed by other dependent
// reducers (e.g. steplist savedForms). In the future, the createPipette logic should
// probably happen before the initial action is dispatched, in the form or mapDispatchToProps

export const editPipettes = (payload: EditPipetteFields) =>
  (dispatch: ThunkDispatch<ChangeFormInputAction>, getState: GetState) => {
    const state = getState()
    const prevPipettesByMount = pipetteSelectors.pipettesByMount(state)
    const savedForms = steplistSelectors.getSavedForms(state)

    const nextPipettesSlice = createNewPipettesSlice(state.pipettes.pipettes, payload.left, payload.right)

    each(savedForms, formData => {
      const formPipetteMount = findKey(prevPipettesByMount, (pipetteData) => (
        (pipetteData && pipetteData.id) === formData.pipette
      ))
      if (formData.pipette && formPipetteMount) {
        const nextPipetteId = nextPipettesSlice.byMount[formPipetteMount]
        const nextChannels = nextPipettesSlice.byId[nextPipetteId] && nextPipettesSlice.byId[nextPipetteId].channels
        dispatch(steplistActions.changeSavedStepForm({
          stepId: formData.id,
          update: {
            ...reconcileFormPipette(formData, state, nextPipetteId, nextChannels),
            pipette: nextPipetteId,
          },
        }))
      }
    })

    dispatch({type: 'UPDATE_PIPETTES', payload: nextPipettesSlice})
  }
