import {
  getTipTypeFromTipRackDefinition,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'
import { getVolumeRange } from './'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { Mount } from '@opentrons/api-client'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type {
  QuickTransferSummaryState,
  TransferType,
  PathOption,
  ChangeTipOptions,
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

  const volumeLimits = getVolumeRange(state)

  let path: PathOption = 'single'
  if (
    state.transferType === 'consolidate' &&
    volumeLimits.max >= state.volume * 2
  ) {
    path = 'multiDispense'
  } else if (
    state.transferType === 'distribute' &&
    volumeLimits.max >= state.volume * 2
  ) {
    path = 'multiAspirate'
  }

  let changeTip: ChangeTipOptions = 'always'
  if (state.sourceWells.length > 96 || state.destinationWells.length > 96) {
    changeTip = 'once'
  }

  const trashConfigCutout = deckConfig.find(
    configCutout =>
      WASTE_CHUTE_FIXTURES.includes(configCutout.cutoutFixtureId) ||
      TRASH_BIN_ADAPTER_FIXTURE === configCutout.cutoutFixtureId
  )
  let dropTipLocation = {
    type: 'trashBin',
    location: 'cutoutA3' as CutoutId,
  }

  if (trashConfigCutout != null) {
    dropTipLocation = {
      type: WASTE_CHUTE_FIXTURES.includes(
        trashConfigCutout.cutoutFixtureId as CutoutFixtureId
      )
        ? 'wasteChute'
        : 'trashBin',
      location: trashConfigCutout.cutoutId as CutoutId,
    }
  }

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
    path: path,
    tipPositionAspirate: 1,
    preWetTip: false,
    tipPositionDispense: 1,
    changeTip,
    dropTipLocation,
  }
}
