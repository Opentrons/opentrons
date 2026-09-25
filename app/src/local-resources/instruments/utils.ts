import { getProtocolUsesGripper } from '/app/transformations/commands'

import type {
  GripperData,
  Instruments,
  PipetteData,
} from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LoadedPipette,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { AttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import type { PipetteInformation } from '/app/resources/instruments/types'

export interface IsPartialTipConfigParams {
  channel: 1 | 8 | 96
  activeNozzleCount: number
}

export function isPartialTipConfig({
  channel,
  activeNozzleCount,
}: IsPartialTipConfigParams): boolean {
  switch (channel) {
    case 1:
      return false
    case 8:
      return activeNozzleCount !== 8
    case 96:
      return activeNozzleCount !== 96
  }
}

export function getIncompleteInstrumentCount(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  attachedInstruments: Instruments
): number {
  const speccedPipettes = analysis?.pipettes ?? []

  const incompleteInstrumentCount = speccedPipettes.filter(loadedPipette => {
    const attachedPipetteMatch = getPipetteMatch(
      loadedPipette,
      attachedInstruments
    )
    return attachedPipetteMatch?.data.calibratedOffset?.last_modified == null
  }).length

  const isExtensionMountReady = getProtocolUsesGripper(analysis)
    ? getAttachedGripper(attachedInstruments)?.data.calibratedOffset
        ?.last_modified != null
    : true

  return incompleteInstrumentCount + (isExtensionMountReady ? 0 : 1)
}

export function getAttachedGripper(
  attachedInstruments: Instruments
): GripperData | null {
  return (
    (attachedInstruments?.data ?? []).find(
      (i): i is GripperData =>
        i.instrumentType === 'gripper' &&
        i.ok &&
        i.data.calibratedOffset != null
    ) ?? null
  )
}

export function getPipetteMatch(
  loadedPipette: LoadedPipette,
  attachedInstruments: Instruments
): PipetteData | null {
  return (
    (attachedInstruments?.data ?? []).find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' &&
        i.ok &&
        i.mount === loadedPipette.mount &&
        i.instrumentName === loadedPipette.pipetteName
    ) ?? null
  )
}

export function getCalibratedPipetteForModuleSetup(
  attachedPipettes: AttachedPipettesFromInstrumentsQuery
): PipetteInformation | null {
  if (attachedPipettes.left?.data.calibratedOffset?.last_modified != null) {
    return attachedPipettes.left
  } else if (
    attachedPipettes.right?.data.calibratedOffset?.last_modified != null
  ) {
    return attachedPipettes.right
  }
  return null
}
