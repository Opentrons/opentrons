import { CONSOLIDATE, DISTRIBUTE, TRANSFER } from './constants'
import type {
  QuickTransferWizardState,
  QuickTransferSummaryState,
  QuickTransferWizardAction,
  QuickTransferSummaryAction,
  TransferType,
} from './types'

export function quickTransferWizardReducer(
  state: QuickTransferWizardState,
  action: QuickTransferWizardAction
): QuickTransferWizardState {
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
      let transferType: TransferType = TRANSFER
      if (
        state.sourceWells != null &&
        state.sourceWells.length > action.wells.length
      ) {
        transferType = CONSOLIDATE
      } else if (
        state.sourceWells != null &&
        state.sourceWells.length < action.wells.length
      ) {
        transferType = DISTRIBUTE
      }
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: state.destination,
        destinationWells: action.wells,
        transferType,
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
        transferType: state.transferType,
        volume: action.volume,
      }
    }
  }
}

export function quickTransferSummaryReducer(
  state: QuickTransferSummaryState,
  action: QuickTransferSummaryAction
): QuickTransferSummaryState {
  switch (action.type) {
    case 'SET_ASPIRATE_FLOW_RATE': {
      return {
        ...state,
        aspirateFlowRate: action.rate,
      }
    }
    case 'SET_DISPENSE_FLOW_RATE': {
      return {
        ...state,
        dispenseFlowRate: action.rate,
      }
    }
    case 'SET_PIPETTE_PATH': {
      if (action.path === 'multiDispense') {
        return {
          ...state,
          path: action.path,
          disposalVolume: action.disposalVolume,
          blowOut: action.blowOutLocation,
        }
      } else {
        return {
          ...state,
          path: action.path,
          disposalVolume: undefined,
        }
      }
    }
    case 'SET_ASPIRATE_TIP_POSITION': {
      return {
        ...state,
        tipPositionAspirate: action.position,
      }
    }
    case 'SET_PRE_WET_TIP': {
      return {
        ...state,
        preWetTip: action.preWetTip,
      }
    }
    case 'SET_MIX_ON_ASPIRATE': {
      return {
        ...state,
        mixOnAspirate: action.mixSettings,
      }
    }
    case 'SET_DELAY_ASPIRATE': {
      return {
        ...state,
        delayAspirate: action.delaySettings,
      }
    }
    case 'SET_TOUCH_TIP_ASPIRATE': {
      return {
        ...state,
        touchTipAspirate: action.position,
      }
    }
    case 'SET_AIR_GAP_ASPIRATE': {
      return {
        ...state,
        airGapAspirate: action.volume,
      }
    }
    case 'SET_DISPENSE_TIP_POSITION': {
      return {
        ...state,
        tipPositionDispense: action.position,
      }
    }
    case 'SET_MIX_ON_DISPENSE': {
      return {
        ...state,
        mixOnDispense: action.mixSettings,
      }
    }
    case 'SET_DELAY_DISPENSE': {
      return {
        ...state,
        delayDispense: action.delaySettings,
      }
    }
    case 'SET_TOUCH_TIP_DISPENSE': {
      return {
        ...state,
        touchTipDispense: action.position,
      }
    }
    case 'SET_BLOW_OUT': {
      return {
        ...state,
        blowOut: action.location,
      }
    }
    case 'SET_AIR_GAP_DISPENSE': {
      return {
        ...state,
        airGapDispense: action.volume,
      }
    }
    case 'SET_CHANGE_TIP': {
      return {
        ...state,
        changeTip: action.changeTip,
      }
    }
    case 'SET_DROP_TIP_LOCATION': {
      return {
        ...state,
        dropTipLocation: action.location,
      }
    }
  }
}
