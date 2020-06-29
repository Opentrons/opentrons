// @flow
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import * as React from 'react'
import { connect } from 'react-redux'

import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import type { LabwareDefByDefURI } from '../../../labware-defs/types'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import type { NewProtocolFields } from '../../../load-file'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import { i18n } from '../../../localization'
import { actions as navigationActions, selectors } from '../../../navigation'
import type { NormalizedPipette, PipetteOnDeck } from '../../../step-forms'
import { actions as stepFormActions } from '../../../step-forms'
import { actions as steplistActions } from '../../../steplist'
import type { BaseState, ThunkDispatch } from '../../../types'
import { uuid } from '../../../utils'
import {
  type ModuleCreationArgs,
  type PipetteFieldsData,
  FilePipettesModal as FilePipettesModalComponent,
} from '../FilePipettesModal'

type Props = React.ElementProps<typeof FilePipettesModalComponent>

type OP = {|
  showProtocolFields: $PropertyType<Props, 'showProtocolFields'>,
|}

type SP = {|
  _customLabware: LabwareDefByDefURI,
  _hasUnsavedChanges: ?boolean,
  hideModal: $PropertyType<Props, 'hideModal'>,
  thermocyclerEnabled: ?boolean,
  moduleRestrictionsDisabled: ?boolean,
|}

type CreateNewProtocolArgs = {|
  customLabware: LabwareDefByDefURI,
  newProtocolFields: NewProtocolFields,
  pipettes: Array<PipetteFieldsData>,
  modules: Array<ModuleCreationArgs>,
|}
type DP = {|
  onCancel: () => mixed,
  _createNewProtocol: CreateNewProtocolArgs => void,
|}

export const NewFileModal: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(FilePipettesModalComponent)

function mapStateToProps(state: BaseState): SP {
  return {
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
    _customLabware: labwareDefSelectors.getCustomLabwareDefsByURI(state),
    hideModal: !selectors.getNewProtocolModal(state),
    thermocyclerEnabled: featureFlagSelectors.getEnableThermocycler(state),
    moduleRestrictionsDisabled: featureFlagSelectors.getDisableModuleRestrictions(
      state
    ),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    _createNewProtocol: (args: CreateNewProtocolArgs) => {
      const { modules, newProtocolFields, pipettes, customLabware } = args
      dispatch(fileActions.createNewProtocol(newProtocolFields))

      const pipettesById: {
        [pipetteId: string]: PipetteOnDeck,
      } = pipettes.reduce((acc, pipette) => ({ ...acc, [uuid()]: pipette }), {})

      // create custom labware
      mapValues(customLabware, labwareDef =>
        dispatch(
          labwareDefActions.createCustomLabwareDefAction({ def: labwareDef })
        )
      )

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
      modules.forEach(moduleArgs =>
        dispatch(stepFormActions.createModule(moduleArgs))
      )

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
    thermocyclerEnabled: stateProps.thermocyclerEnabled,
    moduleRestrictionsDisabled: stateProps.moduleRestrictionsDisabled,
    showModulesFields: true,
    hideModal: stateProps.hideModal,
    onCancel: dispatchProps.onCancel,
    onSave: fields => {
      if (
        !stateProps._hasUnsavedChanges ||
        window.confirm(i18n.t('alert.window.confirm_create_new'))
      ) {
        dispatchProps._createNewProtocol({
          ...fields,
          customLabware: stateProps._customLabware,
        })
      }
    },
  }
}
