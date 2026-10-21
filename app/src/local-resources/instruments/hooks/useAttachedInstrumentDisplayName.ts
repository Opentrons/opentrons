import { useIsOEMMode } from '/app/resources/robot-settings'

import { useGripperDisplayName } from './useGripperDisplayName'
import { usePipetteModelSpecs } from './usePipetteModelSpecs'
import { usePipetteSpecsV2 } from './usePipetteSpecsv2'

import type { GripperData, PipetteData } from '@opentrons/api-client'
import type {
  GripperModel,
  PipetteModel,
  PipetteName,
} from '@opentrons/shared-data'

export function anonymizeInstrumentDisplayName(
  displayName: string,
  isOEMMode: boolean
): string {
  return isOEMMode ? displayName.replace('Flex ', '') : displayName
}

/**
 * Prefer displayName from GET /instruments (loaded def on the robot).
 * Then the v1 model lookup, then v2 specs for the pipette name. A model
 * version newer than pipetteModelSpecs.json still has a product name.
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
      ? instrument.instrumentName
      : undefined

  const modelDisplayName =
    usePipetteModelSpecs(
      (isPipette ? instrument?.instrumentModel : null) as PipetteModel
    )?.displayName ?? null
  const nameDisplayName =
    usePipetteSpecsV2(
      pipetteName != null && pipetteName.includes('_')
        ? (pipetteName as PipetteName)
        : undefined
    )?.displayName ?? null
  const gripperFallback = useGripperDisplayName(
    (isGripper ? instrument?.instrumentModel : null) as GripperModel
  )

  if (instrument == null || !instrument.ok) {
    return null
  }

  if (instrument.displayName != null && instrument.displayName !== '') {
    return anonymizeInstrumentDisplayName(instrument.displayName, isOEMMode)
  }

  if (isGripper) {
    return gripperFallback !== '' ? gripperFallback : null
  }

  return (
    modelDisplayName ??
    nameDisplayName ??
    ('instrumentName' in instrument ? instrument.instrumentName : null)
  )
}
