// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import {uuid} from '../utils'
import i18n from '../localization'
import {selectors, actions as navigationActions} from '../navigation'
import {actions as fileActions, selectors as loadFileSelectors} from '../load-file'
import * as labwareIngredActions from '../labware-ingred/actions'
import {actions as stepFormActions} from '../step-forms'
import {actions as steplistActions} from '../steplist'
import type {BaseState} from '../types'
import type {NewProtocolFields} from '../load-file'

import NewFileModal from '../components/modals/NewFileModal'

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(NewFileModal)

type Props = React.ElementProps<typeof NewFileModal>

type SP = {
  hideModal: $PropertyType<Props, 'hideModal'>,
  _hasUnsavedChanges: ?boolean,
}
type DP = {
  onCancel: () => mixed,
  _createNewProtocol: (NewProtocolFields) => mixed,
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
    _createNewProtocol: fields => {
      dispatch(fileActions.createNewProtocol(fields))
      // TODO: Ian 2018-12-17 after old rerefactor, change NewProtocolFields type
      // to have `{pipettes: {[pipetteId: string]: {name: string, tiprackModel: string, mount: Mount}}`
      // instead of left/right keys
      type PipettesWithMount = {[pipetteId: string]: {name: string, tiprackModel: string, mount: string}}
      const mounts = ['left', 'right']
      const pipettes: PipettesWithMount = mounts.reduce((acc, mount) => {
        const pip = fields[mount]
        if (pip && pip.pipetteModel && pip.tiprackModel) {
          return {
            ...acc,
            [uuid()]: {
              name: pip.pipetteModel,
              tiprackModel: pip.tiprackModel,
              mount,
            },
          }
        }
        return acc
      }, {})

      // create new pipette entities
      // TODO: Ian 2018-12-17 clean up types to createPipettes action
      dispatch(stepFormActions.createPipettes(mapValues(pipettes, (p: $Values<PipettesWithMount>) => ({
        name: p.name,
        tiprackModel: p.tiprackModel,
      }))))

      // update pipette locations in initial deck setup step
      dispatch(steplistActions.changeSavedStepForm({
        stepId: INITIAL_DECK_SETUP_STEP_ID,
        update: {
          pipetteLocationUpdate: mapValues(pipettes, (p: $Values<PipettesWithMount>) => p.mount),
        },
      }))

      // auto-generate tipracks for pipettes
      const newTiprackModels = uniq(Object.values(pipettes)
        .map((pipette: any) => pipette.tiprackModel))

      newTiprackModels.forEach(tiprackModel => {
        dispatch(labwareIngredActions.createContainer({containerType: tiprackModel}))
      })
    },
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  return {
    hideModal: stateProps.hideModal,
    onCancel: dispatchProps.onCancel,
    onSave: (fields) => {
      if (!stateProps._hasUnsavedChanges || window.confirm(i18n.t('alert.window.confirm_create_new'))) {
        dispatchProps._createNewProtocol(fields)
      }
    },
  }
}
