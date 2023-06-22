import type {
  CompletedProtocolAnalysis,
  LoadedPipette,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import {
  AllPipetteOffsetCalibrations,
  GripperData,
  Instruments,
  PipetteData,
  PipetteOffsetCalibration,
} from '@opentrons/api-client'

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

export function getCalibrationDataForPipetteMatch(
  attachedPipetteMatch: PipetteData,
  allPipettesCalibrationData: AllPipetteOffsetCalibrations
): PipetteOffsetCalibration | null {
  return (
    allPipettesCalibrationData?.data.find(
      cal =>
        cal.mount === attachedPipetteMatch.mount &&
        cal.pipette === attachedPipetteMatch.instrumentName
    ) ?? null
  )
}

export function getAreInstrumentsReady(
  analysis: CompletedProtocolAnalysis,
  attachedInstruments: Instruments,
  allPipettesCalibrationData: AllPipetteOffsetCalibrations
): boolean {
  const speccedPipettes = analysis?.pipettes ?? []
  const allSpeccedPipettesReady = speccedPipettes.every(loadedPipette => {
    const attachedPipetteMatch = getPipetteMatch(
      loadedPipette,
      attachedInstruments
    )
    // const calibrationData =
    //   attachedPipetteMatch != null
    //     ? getCalibrationDataForPipetteMatch(
    //         attachedPipetteMatch,
    //         allPipettesCalibrationData
    //       )
    //     : null
    return attachedPipetteMatch != null // TODO: check for presence of calibration data once instruments endpoint
    // returns calibration data for pipettes
  })
  const isExtensionMountReady = getProtocolUsesGripper(analysis)
    ? getAttachedGripper(attachedInstruments) != null
    : true

  return allSpeccedPipettesReady && isExtensionMountReady
}
