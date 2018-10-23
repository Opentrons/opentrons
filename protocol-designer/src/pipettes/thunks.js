// @flow
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import each from 'lodash/each'

import {selectors as steplistSelectors, type ChangeSavedStepFormAction} from '../steplist'
import {selectors as pipetteSelectors} from '../pipettes'

export const editPipettes = (payload: EditPipetteFields) =>
  (dispatch: ThunkDispatch<ChangeFormInputAction>, getState: GetState) => {
    const state = getState()
    const prevPipettesByMount = pipetteSelectors.pipettesByMount(state)

    const changedPipettesByMount = filter(prevPipettesByMount, (pipetteData, mount) => (
      pipetteData.model !== payload[mount].pipetteModel || pipetteData.tiprackModel !== payload[mount].tiprackModel
    ))
    const savedForms = steplistSelectors.getSavedForms(state)
    const effectedForms = filter(savedForms, (form, stepId) => {
      form.pipette && some(changedPipettesByMount, pipetteData => pipetteData.id === form.pipette)
    })
    if (!isEmpty(effectedForms)) {
      each(effectedForms, form => {
        dispatch(steplistActions.changeSavedStepForm(nextPipette))

        {
          type: 'CHANGE_SAVED_STEP_FORM',
          payload: handleFormChange(payload, getState),
        })
      })
    }
    dispatch({type: 'EDIT_PIPETTES', payload})
  }
