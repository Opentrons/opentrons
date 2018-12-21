// @flow
import type {ElementProps} from 'react'
import {connect} from 'react-redux'
import mapValues from 'lodash/mapValues'

import {uuid} from '../../../utils'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../../constants'
import {actions as steplistActions} from '../../../steplist' // TODO IMMEDIATELY
import {
  actions as stepFormActions,
  selectors as stepFormSelectors,
} from '../../../step-forms'
import NewFileModal from '../NewFileModal'
import type {BaseState, ThunkDispatch} from '../../../types'
import type {PipetteEntities} from '../../../step-forms'

type Props = ElementProps<typeof NewFileModal>

type SP = {
  hideModal: $PropertyType<Props, 'hideModal'>,
  // _hasUnsavedChanges: ?boolean, // TODO IMMEDIATELY delete right?
  _prevPipettes: PipetteEntities,
}

type OP = {
  closeModal: () => mixed,
}

const mapSTP = (state: BaseState): SP => {
  const initialPipettes = stepFormSelectors.getPipettesForEditPipetteForm(state)
  return {
    hideModal: false, // TODO IMMEDIATELY
    initialPipetteValues: initialPipettes,
    _prevPipettes: stepFormSelectors.getPipetteInvariantProperties(state),
  }
}

const mergeProps = (stateProps: SP, dispatchProps: {dispatch: ThunkDispatch<*>}, ownProps: OP): Props => {
  const {dispatch} = dispatchProps
  const {_prevPipettes, ...passThruStateProps} = stateProps
  const updatePipettes = ({pipettes}) => {
    const prevPipetteIds = Object.keys(_prevPipettes)
    let usedPrevPipettes = [] // IDs of pipettes in prevPipettes that were already used
    // TODO IMMEDIATELY there's a buncha funkiness below, clean up immediately
    let nextPipettes = {}
    pipettes.forEach(newPipette => {
      if (newPipette && newPipette.name && newPipette.tiprackModel) {
        const candidatePipetteIds = prevPipetteIds.filter(id => {
          const prevPip = _prevPipettes[id]
          const alreadyUsed = usedPrevPipettes.some(usedId => usedId === id)
          return !alreadyUsed && prevPip.name === newPipette.name
        })
        const pipetteId: ?string = candidatePipetteIds[0]
        if (pipetteId) {
          // update used pipette list
          usedPrevPipettes.push(pipetteId)
          nextPipettes[pipetteId] = newPipette
        } else {
          nextPipettes[uuid()] = newPipette
        }
      }
    })

    dispatch(stepFormActions.createPipettes(
      mapValues(nextPipettes, (p: $Values<typeof nextPipettes>) =>
        ({name: p.name, tiprackModel: p.tiprackModel}))))

    // set/update pipette locations in initial deck setup step
    dispatch(steplistActions.changeSavedStepForm({
      stepId: INITIAL_DECK_SETUP_STEP_ID,
      update: {
        pipetteLocationUpdate: mapValues(nextPipettes, p => p.mount),
      },
    }))

    // delete any pipettes no longer in use
    const pipetteIdsToDelete = Object.keys(_prevPipettes).filter(id => !(id in nextPipettes))
    if (pipetteIdsToDelete.length > 0) {
      dispatch(stepFormActions.deletePipettes(pipetteIdsToDelete))
    }
  }

  return {
    ...ownProps,
    useProtocolFields: false,
    ...passThruStateProps,
    onSave: updatePipettes,
    onCancel: ownProps.closeModal,
  }
}

export default connect(mapSTP, null, mergeProps)(NewFileModal)
