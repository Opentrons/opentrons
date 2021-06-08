import * as React from 'react'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { uuid } from '../../../utils'
import { i18n } from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { selectors, actions as navigationActions } from '../../../navigation'
import {
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { actions as stepFormActions } from '../../../step-forms'
import { actions as steplistActions } from '../../../steplist'
import type {
  ModuleCreationArgs,
  PipetteFieldsData,
} from '../FilePipettesModal'
import { FilePipettesModal as FilePipettesModalComponent } from '../FilePipettesModal'
import type { NormalizedPipette } from '@opentrons/step-generation'
import type { BaseState, ThunkDispatch } from '../../../types'
import type { NewProtocolFields } from '../../../load-file'
import type { PipetteOnDeck } from '../../../step-forms'
import type { LabwareDefByDefURI } from '../../../labware-defs/types'
type Props = React.ElementProps<typeof FilePipettesModalComponent>
type OP = {
  showProtocolFields: Props['showProtocolFields']
}
type SP = {
  _customLabware: LabwareDefByDefURI
  _hasUnsavedChanges: boolean | null | undefined
  hideModal: Props['hideModal']
  moduleRestrictionsDisabled: boolean | null | undefined
}
type CreateNewProtocolArgs = {
  customLabware: LabwareDefByDefURI
  newProtocolFields: NewProtocolFields
  pipettes: PipetteFieldsData[]
  modules: ModuleCreationArgs[]
}
type DP = {
  onCancel: () => unknown
  _createNewProtocol: (arg0: CreateNewProtocolArgs) => void
}
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
    moduleRestrictionsDisabled: featureFlagSelectors.getDisableModuleRestrictions(
      state
    ),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
  return {
    onCancel: () => dispatch(navigationActions.toggleNewProtocolModal(false)),
    _createNewProtocol: (args: CreateNewProtocolArgs) => {
      const { modules, newProtocolFields, pipettes, customLabware } = args
      dispatch(fileActions.createNewProtocol(newProtocolFields))
      const pipettesById: Record<string, PipetteOnDeck> = pipettes.reduce(
        (acc, pipette) => ({ ...acc, [uuid()]: pipette }),
        {}
      )
      // create custom labware
      mapValues(customLabware, labwareDef =>
        dispatch(
          labwareDefActions.createCustomLabwareDefAction({
            def: labwareDef,
          })
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
              (p: typeof pipettesById[keyof typeof pipettesById]) => p.mount
            ),
          },
        })
      )
      // create modules
      modules.forEach(moduleArgs =>
        dispatch(stepFormActions.createModule(moduleArgs))
      )
      // auto-generate tipracks for pipettes
      const newTiprackModels: string[] = uniq(
        pipettes.map(pipette => pipette.tiprackDefURI)
      )
      newTiprackModels.forEach(tiprackDefURI => {
        dispatch(
          labwareIngredActions.createContainer({
            labwareDefURI: tiprackDefURI,
          })
        )
      })
    },
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  return {
    ...ownProps,
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
