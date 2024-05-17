import type { QuickTransferWizardState } from '../types'

export function getVolumeRange(
  state: QuickTransferWizardState
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
