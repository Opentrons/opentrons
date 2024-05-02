import { makeWellSetHelpers } from '@opentrons/shared-data'
import { getAllDefinitions } from '../../pages/Labware/helpers/definitions'
import type {
  LabwareDefinition2,
  PipetteV2Specs,
  WellSetHelpers,
} from '@opentrons/shared-data'
import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'
import { LabwareFilter } from '../../pages/Labware/types'

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

export function getCompatibleLabwareByCategory(
  pipetteSpecs: PipetteV2Specs | undefined,
  category: LabwareFilter
): LabwareDefinition2[] | undefined {
  const allLabwareDefinitions = getAllDefinitions()
  const wellSetHelpers: WellSetHelpers = makeWellSetHelpers()
  const { canPipetteUseLabware } = wellSetHelpers
  if (pipetteSpecs == null) return undefined
  let compatibleLabwareDefinitions = allLabwareDefinitions
  if (pipetteSpecs.channels !== 1) {
    compatibleLabwareDefinitions = allLabwareDefinitions.filter(def =>
      canPipetteUseLabware(pipetteSpecs.channels, def)
    )
  }

  if (category === 'all') {
    return compatibleLabwareDefinitions.filter(
      def =>
        def.metadata.displayCategory === 'reservoir' ||
        def.metadata.displayCategory === 'tubeRack' ||
        def.metadata.displayCategory === 'wellPlate'
    )
  } else if (category === 'reservoir') {
    return compatibleLabwareDefinitions.filter(
      def => def.metadata.displayCategory === 'reservoir'
    )
  } else if (category === 'tubeRack') {
    return compatibleLabwareDefinitions.filter(
      def => def.metadata.displayCategory === 'tubeRack'
    )
  } else if (category === 'wellPlate') {
    return compatibleLabwareDefinitions.filter(
      def => def.metadata.displayCategory === 'wellPlate'
    )
  }
}

export function getVolumeLimits(
  state: QuickTransferSetupState
): { min: number; max: number } {
  if (
    state.pipette == null ||
    state.tipRack == null ||
    state.source == null ||
    state.sourceWells == null ||
    state.destination == null ||
    state.destinationWells == null
  ) {
    // this should only be called once all state values are set
    return { min: 0, max: 0 }
  }

  const minPipetteVolume = Object.values(state.pipette.liquids)[0].minVolume
  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipRackVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume
  const sourceLabwareVolume = Math.min(
    ...state.sourceWells.map(well => state.source.wells[well].totalLiquidVolume)
  )

  const destLabwareVolume = Math.min(
    ...state.destinationWells.map(well =>
      state.destination === 'source'
        ? state.source.wells[well].totalLiquidVolume
        : state.destination.wells[well].totalLiquidVolume
    )
  )
  let maxVolume = maxPipetteVolume
  if (state.sourceWells.length === state.destinationWells.length) {
    // 1 to 1 transfer
    maxVolume = Math.min(
      ...[
        maxPipetteVolume,
        tipRackVolume,
        sourceLabwareVolume,
        destLabwareVolume,
      ]
    )
  } else if (state.sourceWells.length < state.destinationWells.length) {
    // 1 to n transfer
    const ratio = state.sourceWells.length / state.destinationWells.length

    maxVolume = Math.min(
      ...[
        maxPipetteVolume,
        tipRackVolume,
        sourceLabwareVolume * ratio,
        destLabwareVolume,
      ]
    )
  } else if (state.sourceWells.length > state.destinationWells.length) {
    // n to 1 transfer
    const ratio = state.destinationWells.length / state.sourceWells.length

    maxVolume = Math.min(
      ...[
        maxPipetteVolume,
        tipRackVolume,
        sourceLabwareVolume,
        destLabwareVolume * ratio,
      ]
    )
  }

  return { min: minPipetteVolume, max: maxVolume }
}
