import { connect } from 'react-redux'
import {
  getAreSlotsHorizontallyAdjacent,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  LabwareSelectionModal as LabwareSelectionModalComponent,
  Props as LabwareSelectionModalProps,
} from './LabwareSelectionModal'
import {
  closeLabwareSelector,
  createContainer,
} from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import {
  actions as labwareDefActions,
  selectors as labwareDefSelectors,
} from '../../labware-defs'
import { selectors as stepFormSelectors, ModuleOnDeck } from '../../step-forms'
import { getHas96Channel } from '../../utils'
import { getPipetteEntities } from '../../step-forms/selectors'
import { adapter96ChannelDefUri } from '../modals/CreateFileWizard'
import type { BaseState, ThunkDispatch } from '../../types'
interface SP {
  customLabwareDefs: LabwareSelectionModalProps['customLabwareDefs']
  slot: LabwareSelectionModalProps['slot']
  parentSlot: LabwareSelectionModalProps['parentSlot']
  moduleModel: LabwareSelectionModalProps['moduleModel']
  permittedTipracks: LabwareSelectionModalProps['permittedTipracks']
  isNextToHeaterShaker: boolean
  has96Channel: boolean
  adapterDefUri?: string
  adapterLoadName?: string
}

function mapStateToProps(state: BaseState): SP {
  const slot = labwareIngredSelectors.selectedAddLabwareSlot(state) || null
  const pipettes = getPipetteEntities(state)
  const has96Channel = getHas96Channel(pipettes)

  // TODO: Ian 2019-10-29 needs revisit to support multiple manualIntervention steps
  const modulesById = stepFormSelectors.getInitialDeckSetup(state).modules
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const labwareById = stepFormSelectors.getInitialDeckSetup(state).labware
  const parentModule =
    (slot != null &&
      initialModules.find(moduleOnDeck => moduleOnDeck.id === slot)) ||
    null
  const parentSlot = parentModule != null ? parentModule.slot : null
  const moduleModel = parentModule != null ? parentModule.model : null
  const isNextToHeaterShaker = initialModules.some(
    hardwareModule =>
      hardwareModule.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hardwareModule.slot, parentSlot ?? slot)
  )
  const adapterLoadNameOnDeck = Object.values(labwareById)
    .filter(labwareOnDeck => slot === labwareOnDeck.id)
    .map(labwareOnDeck => labwareOnDeck.def.parameters.loadName)[0]

  return {
    customLabwareDefs: labwareDefSelectors.getCustomLabwareDefsByURI(state),
    slot,
    parentSlot,
    moduleModel,
    isNextToHeaterShaker,
    has96Channel,
    adapterDefUri: has96Channel ? adapter96ChannelDefUri : undefined,
    permittedTipracks: stepFormSelectors.getPermittedTipracks(state),
    adapterLoadName: adapterLoadNameOnDeck,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): LabwareSelectionModalProps {
  const dispatch = dispatchProps.dispatch
  return {
    ...stateProps,
    onClose: () => {
      dispatch(closeLabwareSelector())
    },
    onUploadLabware: fileChangeEvent =>
      dispatch(labwareDefActions.createCustomLabwareDef(fileChangeEvent)),
    selectLabware: labwareDefURI => {
      if (stateProps.slot) {
        dispatch(
          createContainer({
            slot: stateProps.slot,
            labwareDefURI,
          })
        )
      }
    },
  }
}

export const LabwareSelectionModal = connect(
  mapStateToProps,
  // @ts-expect-error(sa, 2021-6-21): TODO: refactor to use hooks api
  null,
  mergeProps
)(LabwareSelectionModalComponent)
