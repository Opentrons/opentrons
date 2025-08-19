import {
  getTipTypeFromTipRackDefinition,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import type { Mount } from '@opentrons/api-client'
import type {
  CutoutConfig,
  DeckConfiguration,
  LabwareDefinition2,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type {
  ChangeTipOptions,
  PathOption,
  QuickTransferSummaryState,
  TransferType,
} from '../types'

interface InitialSummaryStateProps {
  state: {
    pipette: PipetteV2Specs
    mount: Mount
    tipRack: LabwareDefinition2
    source: LabwareDefinition2
    sourceWells: string[]
    destination: LabwareDefinition2 | 'source'
    destinationWells: string[]
    transferType: TransferType
    volume: number
    path: PathOption
    liquidClassName: string
    pushOutDispense?: {
      volume: number
    }
    changeTip: ChangeTipOptions
    dropTipLocation?: CutoutConfig
  }
  deckConfig: DeckConfiguration
}

// sets up the initial summary state with defaults based on selections made
// in the wizard flow
export function getInitialSummaryState(
  props: InitialSummaryStateProps
): QuickTransferSummaryState {
  const { state, deckConfig } = props
  const tipType = getTipTypeFromTipRackDefinition(state.tipRack)
  const flowRatesForSupportedTip =
    state.pipette.liquids.default.supportedTips[tipType]

  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume

  // this is the max amount of liquid that can be held in the tip at any time
  const maxTipCapacity = Math.min(maxPipetteVolume, tipVolume)

  let path: PathOption = state.path
  // for multiDispense the volume capacity must be at least 3x the volume per well
  // to account for the 1x volume per well disposal volume default
  if (
    state.transferType === 'distribute' &&
    maxTipCapacity >= state.volume * 3
  ) {
    path = 'multiDispense'
    // for multiAspirate the volume capacity must be at least 2x the volume per well
  } else if (
    state.transferType === 'consolidate' &&
    maxTipCapacity >= state.volume * 2
  ) {
    path = 'multiAspirate'
  }

  const trashConfigCutout = deckConfig.find(
    configCutout =>
      WASTE_CHUTE_FIXTURES.includes(configCutout.cutoutFixtureId) ||
      TRASH_BIN_ADAPTER_FIXTURE === configCutout.cutoutFixtureId
    // if no trash or waste chute found, default to a trash bin in A3
  ) ?? { cutoutId: 'cutoutA3', cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE }

  return {
    pipette: state.pipette,
    mount: state.mount,
    tipRack: state.tipRack,
    source: state.source,
    sourceWells: state.sourceWells,
    destination: state.destination,
    destinationWells: state.destinationWells,
    transferType: state.transferType,
    volume: state.volume,
    aspirateFlowRate: flowRatesForSupportedTip.defaultAspirateFlowRate.default,
    dispenseFlowRate: flowRatesForSupportedTip.defaultDispenseFlowRate.default,
    path,
    disposalVolume: path === 'multiDispense' ? state.volume : undefined,
    blowOutDispense:
      path === 'multiDispense'
        ? {
            location: trashConfigCutout,
            flowRate: flowRatesForSupportedTip.defaultDispenseFlowRate.default,
          }
        : undefined,
    tipPositionAspirate: 1,
    preWetTip: false,
    tipPositionDispense: 1,
    changeTip: state.changeTip,
    dropTipLocation: state.dropTipLocation ?? trashConfigCutout,
    liquidClassName: state.liquidClassName,
    liquidClassValuesInitialized: false,
    pushOutDispense: state.pushOutDispense,
  }
}
