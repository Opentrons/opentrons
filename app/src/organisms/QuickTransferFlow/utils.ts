import {
  makeWellSetHelpers,
  getLabwareDefURI,
  getAllDefinitions,
} from '@opentrons/shared-data'
import { getAllDefinitions as getAllLatestDefValues } from '../../pages/Labware/helpers/definitions'
import {
  SINGLE_CHANNEL_COMPATIBLE_LABWARE,
  EIGHT_CHANNEL_COMPATIBLE_LABWARE,
  NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE,
} from './constants'

import type {
  LabwareDefinition2,
  PipetteV2Specs,
  WellSetHelpers,
} from '@opentrons/shared-data'
import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'
import type { LabwareFilter } from '../../pages/Labware/types'

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
  pipetteChannels: 1 | 8 | 96,
  category: LabwareFilter
): LabwareDefinition2[] | undefined {
  const allLabwareDefinitions = getAllDefinitions()
  let compatibleLabwareUris: string[] = SINGLE_CHANNEL_COMPATIBLE_LABWARE
  if (pipetteChannels === 8) {
    compatibleLabwareUris = EIGHT_CHANNEL_COMPATIBLE_LABWARE
  } else if (pipetteChannels === 96) {
    compatibleLabwareUris = NINETY_SIX_CHANNEL_COMPATIBLE_LABWARE
  }

  const compatibleLabwareDefinitions = compatibleLabwareUris.reduce<
    LabwareDefinition2[]
  >((acc, defUri) => {
    return [...acc, allLabwareDefinitions[defUri]]
  }, [])

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
    ...state.sourceWells.map(well =>
      state.source ? state.source.wells[well].totalLiquidVolume : 0
    )
  )

  const destLabwareVolume = Math.min(
    ...state.destinationWells.map(well => {
      if (state.source == null || state.destination == null) return 0
      return state.destination === 'source'
        ? state.source.wells[well].totalLiquidVolume
        : state.destination.wells[well].totalLiquidVolume
    })
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

export function generateCompatibleLabwareForPipette(
  pipetteSpecs: PipetteV2Specs
): string[] {
  const allLabwareDefinitions = getAllLatestDefValues()
  const wellSetHelpers: WellSetHelpers = makeWellSetHelpers()
  const { canPipetteUseLabware } = wellSetHelpers

  const compatibleDefUriList = allLabwareDefinitions.reduce<string[]>(
    (acc, definition) => {
      if (pipetteSpecs.channels === 1) {
        return [...acc, getLabwareDefURI(definition)]
      } else {
        const isCompatible = canPipetteUseLabware(pipetteSpecs, definition)
        return isCompatible ? [...acc, getLabwareDefURI(definition)] : acc
      }
    },
    []
  )

  // console.log(JSON.stringify(compatibleDefUriList))
  // to update this list, uncomment the above log statement and
  // paste the result into the const in ./constants.ts
  return compatibleDefUriList
}
