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

export const editPipettes = (payload: EditPipetteFields) =>
  (dispatch: ThunkDispatch<ChangeFormInputAction>, getState: GetState) => {
    const state = getState()
    const prevPipettesByMount = pipetteSelectors.pipettesByMount(state)
    const savedForms = steplistSelectors.getSavedForms(state)

    // const changedPipettesByMount = reduce(prevPipettesByMount, (prevPipetteData, mount) => {
    //   const nextPipetteFormData = payload[mount]
    //   const pipetteChanged = prevPipetteData.model !== nextPipetteFormData && nextPipetteFormData.pipetteModel
    //   const tiprackChanged = prevPipetteData.tiprackModel !== nextPipetteFormData && nextPipetteFormData.tiprackModel
    //   console.table({nextPipetteFormData, prevPipetteData, mount})
    //   return pipetteChanged || tiprackChanged
    // }, {})
    const effectedForms = pickBy(savedForms, (formData, stepId) => (
      formData.pipette && some(prevPipettesByMount, pipetteData => pipetteData.id === formData.pipette)
    ))
    console.log('effect', effectedForms)
    const nextPipettesSlice = createNewPipettesSlice(state, payload.left, payload.right)

    if (!isEmpty(effectedForms)) {
      each(effectedForms, formData => {
        const changedMount = findKey(prevPipettesByMount, (pipetteData) => pipetteData.id === formData.pipette)
        const nextPipetteId = nextPipettesSlice.byMount[changedMount]
        const nextChannels = nextPipettesSlice.byId[nextPipetteId].channels
        console.log('effectedForm', formData.id)
        dispatch(steplistActions.changeSavedStepForm({
          stepId: formData.id,
          update: {
            ...reconcileFormPipette(formData, state, nextPipetteId, nextChannels),
            pipette: nextPipetteId,
          },
        }))
      })
    }

    dispatch({type: 'UPDATE_PIPETTES', payload: nextPipettesSlice})
  }
