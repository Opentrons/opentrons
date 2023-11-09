import type {
  CompletedProtocolAnalysis,
  LoadedPipette,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { GripperData, Instruments, PipetteData } from '@opentrons/api-client'

export function getProtocolUsesGripper(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
): boolean {
  return (
    analysis?.commands.some(
      c =>
        c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
    ) ?? false
  )
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

export function getAreInstrumentsReady(
  analysis: CompletedProtocolAnalysis,
  attachedInstruments: Instruments
): boolean {
  const speccedPipettes = analysis?.pipettes ?? []
  const allSpeccedPipettesReady = speccedPipettes.every(loadedPipette => {
    const attachedPipetteMatch = getPipetteMatch(
      loadedPipette,
      attachedInstruments
    )
    return attachedPipetteMatch?.data.calibratedOffset?.last_modified != null
  })
  const isExtensionMountReady = getProtocolUsesGripper(analysis)
    ? getAttachedGripper(attachedInstruments)?.data.calibratedOffset
        ?.last_modified != null
    : true

  return allSpeccedPipettesReady && isExtensionMountReady
}

export function getIncompleteInstrumentCount(
  analysis: CompletedProtocolAnalysis,
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
