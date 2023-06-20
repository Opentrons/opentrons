import { NormalizedPipette, uuid } from '@opentrons/step-generation'
import { LabwareDefByDefURI } from '../../../labware-defs'
import {
  NewProtocolFields,
  actions as fileActions,
  selectors as loadFileSelectors,
} from '../../../load-file'
import { actions as stepFormActions, PipetteOnDeck } from '../../../step-forms'
import { BaseState, ThunkDispatch } from '../../../types'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { actions as steplistActions } from '../../../steplist'
import * as labwareDefSelectors from '../../../labware-defs/selectors'
import * as labwareDefActions from '../../../labware-defs/actions'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import {
  ModuleCreationArgs,
  PipetteFieldsData,
} from '../../modals/FilePipettesModal'
import { mapValues, omit, uniq } from 'lodash'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../../constants'
import { selectors, actions as navigationActions } from '../../../navigation'
import { FlexProtocolEditorComponent } from '../FlexProtocolEditor'
type Props = React.ComponentProps<typeof FlexProtocolEditorComponent>
interface SP {
  _customLabware: LabwareDefByDefURI
  _hasUnsavedChanges?: boolean | null
  hideModal: Props['hideModal']
  moduleRestrictionsDisabled?: boolean | null
}

interface CreateNewProtocolArgs {
  customLabware: LabwareDefByDefURI
  newProtocolFields: NewProtocolFields
  pipettes: PipetteFieldsData[]
  modules: ModuleCreationArgs[]
}
interface DP {
  onCancel: () => unknown
  _createNewProtocol: (arg0: CreateNewProtocolArgs) => void
}

export function mapStateToProps(state: BaseState): SP {
  return {
    _hasUnsavedChanges: loadFileSelectors.getHasUnsavedChanges(state),
    _customLabware: labwareDefSelectors.getCustomLabwareDefsByURI(state),
    hideModal: !selectors.getNewProtocolModal(state),
    moduleRestrictionsDisabled: featureFlagSelectors.getDisableModuleRestrictions(
      state
    ),
  }
}

export function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
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
              // @ts-expect-error(sa, 2021-6-22): id will always get overwritten
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
        const tiprackDefURIData = [...tiprackDefURI]
        tiprackDefURIData.forEach((item: any) => {
          dispatch(
            labwareIngredActions.createContainer({
              labwareDefURI: item,
            })
          )
        })
      })
    },
  }
}
