import { getPipetteNameSpecs } from '@opentrons/shared-data'
import type { FlowRateSpec, PipetteName } from '@opentrons/shared-data'
import type { FlowRateKind, QuickTransferSummaryState } from '../types'

export function getFlowRateRange(
  state: QuickTransferSummaryState,
  kind: FlowRateKind
): { min: number; max: number } {
  let pipetteName = state.pipette.model
  if (state.pipette.channels === 1) {
    pipetteName = pipetteName + `_single_flex`
  } else if (state.pipette.channels === 8) {
    pipetteName = pipetteName + `_multi_flex`
  } else {
    pipetteName = pipetteName + `_96`
  }

  const spec = getPipetteNameSpecs(pipetteName as PipetteName)
  let defaultFlowRate: FlowRateSpec | undefined
  if (kind === 'aspirate') defaultFlowRate = spec?.defaultAspirateFlowRate
  else if (kind === 'dispense') defaultFlowRate = spec?.defaultDispenseFlowRate
  else if (kind === 'blowout') defaultFlowRate = spec?.defaultBlowOutFlowRate
  const min: number = defaultFlowRate?.min != null ? defaultFlowRate.min : 0
  const max: number =
    defaultFlowRate?.max != null ? defaultFlowRate.max : Infinity
  return { min, max }
}
