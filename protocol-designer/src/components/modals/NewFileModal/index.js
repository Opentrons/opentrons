// @flow
import type { ElementProps } from 'react'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { uuid } from '../../../utils'
import i18n from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { selectors, actions as navigationActions } from '../../../navigation'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { actions as stepFormActions } from '../../../step-forms'
import { actions as steplistActions } from '../../../steplist'
import FilePipettesModal from '../FilePipettesModal'
import type { BaseState, ThunkDispatch } from '../../../types'
import type { PipetteOnDeck, NormalizedPipette } from '../../../step-forms'

type Props = ElementProps<typeof FilePipettesModal>

type OP = {|
  showProtocolFields: $PropertyType<Props, 'showProtocolFields'>,
|}

type SP = {|
  hideModal: $PropertyType<Props, 'hideModal'>,
  _hasUnsavedChanges: ?boolean,
  modulesEnabled: ?boolean,
  thermocyclerEnabled: ?boolean,
|}

type DP = {|
  onCancel: () => mixed,
  _createNewProtocol: $PropertyType<Props, 'onSave'>,
|}

export default connect<Props, OP, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(FilePipettesModal)

function mapStateToProps(state: BaseState): SP {
  return {
    hideModal: !selectors.getNewProtocolModal(state),
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
    modulesEnabled: featureFlagSelectors.getEnableModules(state),
    thermocyclerEnabled: featureFlagSelectors.getEnableThermocycler(state),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    _createNewProtocol: ({ modules, newProtocolFields, pipettes }) => {
      dispatch(fileActions.createNewProtocol(newProtocolFields))

      const pipettesById: {
        [pipetteId: string]: PipetteOnDeck,
      } = pipettes.reduce((acc, pipette) => ({ ...acc, [uuid()]: pipette }), {})

      // create new pipette entities
      dispatch(
        stepFormActions.createPipettes(
          mapValues(
            pipettesById,
            (p: PipetteOnDeck, id: string): NormalizedPipette => ({
              id,
              ...omit(p, 'mount'),
            })
          )
        )
      )

      // update pipette locations in initial deck setup step
      dispatch(
        steplistActions.changeSavedStepForm({
          stepId: INITIAL_DECK_SETUP_STEP_ID,
          update: {
            pipetteLocationUpdate: mapValues(
              pipettesById,
              (p: $Values<typeof pipettesById>) => p.mount
            ),
          },
        })
      )

      // create modules
      modules.forEach(module => dispatch(stepFormActions.createModule(module)))

      // auto-generate tipracks for pipettes
      const newTiprackModels: Array<string> = uniq(
        pipettes.map(pipette => pipette.tiprackDefURI)
      )

      newTiprackModels.forEach(tiprackDefURI => {
        dispatch(
          labwareIngredActions.createContainer({ labwareDefURI: tiprackDefURI })
        )
      })
    },
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  return {
    ...ownProps,
    modulesEnabled: stateProps.modulesEnabled,
    thermocyclerEnabled: stateProps.thermocyclerEnabled,
    showModulesFields: true,
    hideModal: stateProps.hideModal,
    onCancel: dispatchProps.onCancel,
    onSave: fields => {
      if (
        !stateProps._hasUnsavedChanges ||
        window.confirm(i18n.t('alert.window.confirm_create_new'))
      ) {
        dispatchProps._createNewProtocol(fields)
      }
    },
  }
}
