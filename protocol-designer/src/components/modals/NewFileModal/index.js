// @flow
import type {ElementProps} from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../../constants'
import {uuid} from '../../../utils'
import i18n from '../../../localization'
import {selectors, actions as navigationActions} from '../../../navigation'
import {actions as fileActions, selectors as loadFileSelectors} from '../../../load-file'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import {actions as stepFormActions} from '../../../step-forms'
import {actions as steplistActions} from '../../../steplist'
import FilePipettesModal from '../FilePipettesModal'
import type {BaseState} from '../../../types'
import type {PipetteOnDeck} from '../../../step-forms'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(FilePipettesModal)

type Props = ElementProps<typeof FilePipettesModal>

type OP = {
  useProtocolFields: $PropertyType<Props, 'useProtocolFields'>,
}

type SP = {
  hideModal: $PropertyType<Props, 'hideModal'>,
  _hasUnsavedChanges: ?boolean,
}
type DP = {
  onCancel: () => mixed,
  _createNewProtocol: $PropertyType<Props, 'onSave'>,
}

function mapStateToProps (state: BaseState): SP {
  return {
    hideModal: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    _createNewProtocol: ({newProtocolFields, pipettes}) => {
      dispatch(fileActions.createNewProtocol(newProtocolFields))

      const pipettesById: {[pipetteId: string]: PipetteOnDeck} = pipettes.reduce((acc, pipette) =>
        ({...acc, [uuid()]: pipette}), {})

      // create new pipette entities
      // TODO: Ian 2018-12-21 $FlowFixMe flow doesn't want 'mount' to go in `createPipettes`, though this is handled with a `pick` in createPipettes already. I tried typing the arg to createPipettes differently but couldn't get anything to work
      dispatch(stepFormActions.createPipettes(pipettesById))

      // update pipette locations in initial deck setup step
      dispatch(steplistActions.changeSavedStepForm({
        stepId: INITIAL_DECK_SETUP_STEP_ID,
        update: {
          pipetteLocationUpdate: mapValues(pipettesById, (p: $Values<typeof pipettesById>) => p.mount),
        },
      }))

      // auto-generate tipracks for pipettes
      const newTiprackModels = uniq(pipettes.map((pipette) => pipette.tiprackModel))

      newTiprackModels.forEach(tiprackModel => {
        dispatch(labwareIngredActions.createContainer({containerType: tiprackModel}))
      })
    },
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  return {
    ...ownProps,
    hideModal: stateProps.hideModal,
    onCancel: dispatchProps.onCancel,
    onSave: (fields) => {
      if (!stateProps._hasUnsavedChanges || window.confirm(i18n.t('alert.window.confirm_create_new'))) {
        dispatchProps._createNewProtocol(fields)
      }
    },
  }
}
