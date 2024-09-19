import { FLEX_MODULE_ADDRESSABLE_AREAS } from '@opentrons/shared-data'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RobotType,
} from '@opentrons/shared-data'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import type { ProtocolHardware, ProtocolModule, ProtocolFixture } from './types'

/**
 * Returns an array of ProtocolHardware objects that are required by the given protocol ID,
 * but not currently connected.
 *
 * @param {ProtocolHardware[]} requiredProtocolHardware An array of ProtocolHardware objects that are required by a protocol.
 * @param {boolean} isLoading A boolean determining whether any required protocol hardware is loading.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID, but not currently connected.
 */

export const useMissingProtocolHardwareFromRequiredProtocolHardware = (
  requiredProtocolHardware: ProtocolHardware[],
  isLoading: boolean,
  robotType: RobotType,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    protocolAnalysis
  )
  // determine missing or conflicted hardware
  return {
    missingProtocolHardware: [
      ...requiredProtocolHardware.filter(
        hardware => 'connected' in hardware && !hardware.connected
      ),
      ...deckConfigCompatibility
        .filter(
          ({
            cutoutFixtureId,
            compatibleCutoutFixtureIds,
            requiredAddressableAreas,
          }) =>
            cutoutFixtureId != null &&
            !compatibleCutoutFixtureIds.some(id => id === cutoutFixtureId) &&
            !FLEX_MODULE_ADDRESSABLE_AREAS.some(modAA =>
              requiredAddressableAreas.includes(modAA)
            ) // modules are already included via requiredProtocolHardware
        )
        .map(({ compatibleCutoutFixtureIds, cutoutId }) => ({
          hardwareType: 'fixture' as const,
          cutoutFixtureId: compatibleCutoutFixtureIds[0],
          location: { cutout: cutoutId },
          hasSlotConflict: true,
        })),
    ],
    conflictedSlots: requiredProtocolHardware
      .filter(
        (hardware): hardware is ProtocolModule | ProtocolFixture =>
          (hardware.hardwareType === 'module' ||
            hardware.hardwareType === 'fixture') &&
          hardware.hasSlotConflict
      )
      .map(
        hardware =>
          hardware.hardwareType === 'module'
            ? hardware.slot // module
            : hardware.location.cutout // fixture
      ),
    isLoading,
  }
}
