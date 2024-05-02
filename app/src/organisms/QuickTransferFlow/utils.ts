import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

export function quickTransferReducer(
  state: QuickTransferSetupState,
  action: QuickTransferWizardAction
): QuickTransferSetupState {
  switch (action.type) {
    case 'SELECT_PIPETTE': {
      return {
        pipette: action.pipette,
        mount: action.mount,
      }
    }
    case 'SELECT_TIP_RACK': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: action.tipRack,
      }
    }
    case 'SET_SOURCE_LABWARE': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: action.labware,
      }
    }
    case 'SET_SOURCE_WELLS': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: action.wells,
      }
    }
    case 'SET_DEST_LABWARE': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: action.labware,
      }
    }
    case 'SET_DEST_WELLS': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: action.wells,
      }
    }
    case 'SET_VOLUME': {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: state.destinationWells,
        volume: action.volume,
      }
    }
  }
}
