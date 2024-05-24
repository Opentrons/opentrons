import { getTipTypeFromTipRackDefinition } from '@opentrons/shared-data'
import { getVolumeRange } from './'

import type { LabwareDefinition2, PipetteV2Specs } from '@opentrons/shared-data'
import type { Mount } from '@opentrons/api-client'
import type {
  QuickTransferSummaryState,
  TransferType,
  PathOption,
  ChangeTipOptions,
} from '../types'

// sets up the initial summary state with defaults based on selections made
// in the wizard flow
export function getInitialSummaryState(props: {
  pipette: PipetteV2Specs
  mount: Mount
  tipRack: LabwareDefinition2
  source: LabwareDefinition2
  sourceWells: string[]
  destination: LabwareDefinition2 | 'source'
  destinationWells: string[]
  transferType: TransferType
  volume: number
}): QuickTransferSummaryState {
  const tipType = getTipTypeFromTipRackDefinition(props.tipRack)
  const flowRatesForSupportedTip =
    props.pipette.liquids.default.supportedTips[tipType]

  const volumeLimits = getVolumeRange(props)

  let path: PathOption = 'single'
  if (
    props.transferType === 'consolidate' &&
    volumeLimits.max >= props.volume * 2
  ) {
    path = 'multiDispense'
  } else if (
    props.transferType === 'distribute' &&
    volumeLimits.max >= props.volume * 2
  ) {
    path = 'multiAspirate'
  }

  let changeTip: ChangeTipOptions = 'always'
  if (props.sourceWells.length > 96 || props.destinationWells.length > 96) {
    changeTip = 'once'
  }

  return {
    pipette: props.pipette,
    mount: props.mount,
    tipRack: props.tipRack,
    source: props.source,
    sourceWells: props.sourceWells,
    destination: props.destination,
    destinationWells: props.destinationWells,
    transferType: props.transferType,
    volume: props.volume,
    aspirateFlowRate: flowRatesForSupportedTip.defaultAspirateFlowRate.default,
    dispenseFlowRate: flowRatesForSupportedTip.defaultDispenseFlowRate.default,
    path: path,
    tipPositionAspirate: 1,
    preWetTip: false,
    tipPositionDispense: 1,
    // TODO expand default logic for change tip depending on path, transfer type, number of tips
    changeTip,
    // TODO add default logic for drop tip location depending on deck config
    dropTipLocation: 'trashBin',
  }
}
