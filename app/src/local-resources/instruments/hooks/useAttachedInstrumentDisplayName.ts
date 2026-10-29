import { useIsOEMMode } from '/app/resources/robot-settings'

import { useGripperDisplayName } from './useGripperDisplayName'
import { usePipetteSpecsV2 } from './usePipetteSpecsv2'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type { GripperModel, PipetteName } from '@opentrons/shared-data'

export function anonymizeInstrumentDisplayName(
  displayName: string,
  isOEMMode: boolean
): string {
  return isOEMMode ? displayName.replace('Flex ', '') : displayName
}

/**
 * Prefer displayName from the v2 specs for the pipette name.
 * Then GET /instruments (loaded def on the robot) if that's not found
 */
export function useAttachedInstrumentDisplayName(
  instrument: PipetteData | GripperData | null | undefined
): string | null {
  const isOEMMode = useIsOEMMode()
  const isPipette =
    instrument?.ok === true && instrument.instrumentType === 'pipette'
  const isGripper =
    instrument?.ok === true && instrument.instrumentType === 'gripper'
  const pipetteName =
    isPipette && instrument != null && 'instrumentName' in instrument
      ? (instrument.instrumentName as PipetteName)
      : undefined

  const v2DisplayName = usePipetteSpecsV2(pipetteName)?.displayName ?? null

  const gripperFallback = useGripperDisplayName(
    (isGripper ? instrument?.instrumentModel : null) as GripperModel
  )

  if (instrument == null || !instrument.ok) {
    return null
  }
  const hardwareDisplayName =
    instrument.displayName != null && instrument.displayName !== ''
      ? instrument.displayName
      : null
  const preferedPipetteName = v2DisplayName ?? hardwareDisplayName

  if (isGripper) {
    return gripperFallback !== '' ? gripperFallback : null
  }

  return preferedPipetteName != null && preferedPipetteName !== ''
    ? anonymizeInstrumentDisplayName(preferedPipetteName, isOEMMode)
    : null
}
