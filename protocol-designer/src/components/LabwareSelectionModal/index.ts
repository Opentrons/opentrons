import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareSelectionModal as LabwareSelectionModalComponent } from './LabwareSelectionModal'
// import { selectors as featureFlagSelectors } from '../../feature-flags'
import {
  closeLabwareSelector,
  createContainer,
} from '../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import {
  actions as labwareDefActions,
  selectors as labwareDefSelectors,
} from '../../labware-defs'
import { ModuleOnDeck } from '../../step-forms'
import { selectors as stepFormSelectors } from '../../step-forms'
import { BaseState, ThunkDispatch } from '../../types'
type Props = React.ComponentProps<typeof LabwareSelectionModalComponent>
interface SP {
  customLabwareDefs: Props['customLabwareDefs']
  slot: Props['slot']
  parentSlot: Props['parentSlot']
  moduleType: Props['moduleType']
  permittedTipracks: Props['permittedTipracks']
}

function mapStateToProps(state: BaseState): SP {
  const slot = labwareIngredSelectors.selectedAddLabwareSlot(state) || null
  // TODO: Ian 2019-10-29 needs revisit to support multiple manualIntervention steps
  const modulesById = stepFormSelectors.getInitialDeckSetup(state).modules
  const initialModules: ModuleOnDeck[] = Object.keys(modulesById).map(
    moduleId => modulesById[moduleId]
  )
  const parentModule =
    (slot != null &&
      initialModules.find(moduleOnDeck => moduleOnDeck.id === slot)) ||
    null
  return {
    customLabwareDefs: labwareDefSelectors.getCustomLabwareDefsByURI(state),
    slot,
    parentSlot: parentModule != null ? parentModule.slot : null,
    moduleType: parentModule != null ? parentModule.type : null,
    permittedTipracks: stepFormSelectors.getPermittedTipracks(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  }
): Props {
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
  null,
  mergeProps
)(LabwareSelectionModalComponent)
