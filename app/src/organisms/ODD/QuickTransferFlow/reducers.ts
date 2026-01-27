import { ACTIONS, CONSOLIDATE, DISTRIBUTE, TRANSFER } from './constants'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
  QuickTransferWizardAction,
  QuickTransferWizardState,
  TransferType,
} from './types'

export function quickTransferWizardReducer(
  state: QuickTransferWizardState,
  action: QuickTransferWizardAction
): QuickTransferWizardState {
  switch (action.type) {
    case ACTIONS.SELECT_PIPETTE: {
      return {
        pipette: action.pipette,
        mount: action.mount,
      }
    }
    case ACTIONS.SELECT_TIP_RACK: {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: action.tipRack,
      }
    }
    case ACTIONS.SET_SOURCE_LABWARE: {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: action.labware,
      }
    }
    case ACTIONS.SET_SOURCE_WELLS: {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: action.wells,
      }
    }
    case ACTIONS.SET_DEST_LABWARE: {
      return {
        pipette: state.pipette,
        mount: state.mount,
        tipRack: state.tipRack,
        source: state.source,
        sourceWells: state.sourceWells,
        destination: action.labware,
      }
    }
    case ACTIONS.SET_DEST_WELLS: {
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
    case ACTIONS.SET_VOLUME: {
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
    case ACTIONS.SET_PIPETTE_PATH: {
      return {
        ...state,
        path: action.path,
      }
    }

    case ACTIONS.SET_CHANGE_TIP: {
      return {
        ...state,
        changeTip: action.changeTip,
      }
    }
    case ACTIONS.SET_DROP_TIP_LOCATION: {
      return {
        ...state,
        dropTipLocation: action.location,
      }
    }
    case ACTIONS.SET_LIQUID_CLASS: {
      return {
        ...state,
        liquidClassName: action.liquidClassName,
      }
    }
  }
}

export function quickTransferSummaryReducer(
  state: QuickTransferSummaryState,
  action: QuickTransferSummaryAction
): QuickTransferSummaryState {
  switch (action.type) {
    case ACTIONS.SET_ASPIRATE_FLOW_RATE: {
      return {
        ...state,
        aspirateFlowRate: action.rate,
      }
    }
    case ACTIONS.SET_DISPENSE_FLOW_RATE: {
      return {
        ...state,
        dispenseFlowRate: action.rate,
      }
    }
    case ACTIONS.SET_PIPETTE_PATH: {
      return {
        ...state,
        path: action.path,
      }
    }
    case ACTIONS.SET_ASPIRATE_TIP_POSITION: {
      return {
        ...state,
        tipPositionAspirate: action.position,
      }
    }
    case ACTIONS.SET_PRE_WET_TIP: {
      return {
        ...state,
        preWetTip: action.preWetTip,
      }
    }
    case ACTIONS.SET_MIX_ON_ASPIRATE: {
      return {
        ...state,
        mixOnAspirate: action.mixSettings,
      }
    }
    case ACTIONS.SET_DELAY_ASPIRATE: {
      return {
        ...state,
        delayAspirate: action.delaySettings,
      }
    }
    case ACTIONS.SET_SUBMERGE_ASPIRATE: {
      return {
        ...state,
        submergeAspirate: action.submergeSettings,
      }
    }
    case ACTIONS.SET_RETRACT_ASPIRATE: {
      return {
        ...state,
        retractAspirate: action.retractSettings,
      }
    }
    case ACTIONS.SET_TOUCH_TIP_ASPIRATE: {
      return {
        ...state,
        touchTipAspirate: action.position,
        touchTipAspirateSpeed: action.touchTipAspirateSpeed,
      }
    }
    case ACTIONS.SET_AIR_GAP_ASPIRATE: {
      return {
        ...state,
        airGapAspirate: action.volume,
      }
    }
    case ACTIONS.SET_DISPENSE_TIP_POSITION: {
      return {
        ...state,
        tipPositionDispense: action.position,
      }
    }
    case ACTIONS.SET_MIX_ON_DISPENSE: {
      return {
        ...state,
        mixOnDispense: action.mixSettings,
      }
    }
    case ACTIONS.SET_DELAY_DISPENSE: {
      return {
        ...state,
        delayDispense: action.delaySettings,
      }
    }
    case ACTIONS.SET_SUBMERGE_DISPENSE: {
      return {
        ...state,
        submergeDispense: action.submergeSettings,
      }
    }
    case ACTIONS.SET_RETRACT_DISPENSE: {
      return {
        ...state,
        retractDispense: action.retractSettings,
      }
    }
    case ACTIONS.SET_TOUCH_TIP_DISPENSE: {
      return {
        ...state,
        touchTipDispense: action.position,
        touchTipDispenseSpeed: action.touchTipDispenseSpeed,
      }
    }
    case ACTIONS.SET_BLOW_OUT: {
      return {
        ...state,
        blowOutDispense: action.blowOutSettings,
      }
    }
    case ACTIONS.SET_AIR_GAP_DISPENSE: {
      return {
        ...state,
        airGapDispense: action.volume,
      }
    }
    case ACTIONS.SET_CHANGE_TIP: {
      return {
        ...state,
        changeTip: action.changeTip,
      }
    }
    case ACTIONS.SET_DROP_TIP_LOCATION: {
      return {
        ...state,
        dropTipLocation: action.location,
      }
    }
    case ACTIONS.SET_PUSH_OUT: {
      return {
        ...state,
        pushOutDispense: action.pushOutSettings,
      }
    }
    case ACTIONS.SET_CONDITION_ASPIRATE: {
      return {
        ...state,
        conditionAspirate: action.conditionAspirate,
      }
    }
    case ACTIONS.SET_DISPOSAL_VOLUME_DISPENSE: {
      return {
        ...state,
        disposalVolumeDispenseSettings: action.disposalVolumeDispenseSettings,
      }
    }
    case ACTIONS.SET_LIQUID_CLASS_VALUES: {
      return {
        ...state,
        ...action.liquidClassValues,
      }
    }
  }
}
