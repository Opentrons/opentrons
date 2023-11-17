import last from 'lodash/last'
import {
  useDeckConfigurationQuery,
  useInstrumentsQuery,
  useModulesQuery,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'
import { getLabwareSetupItemGroups } from '../utils'
import { getProtocolUsesGripper } from '../../../organisms/ProtocolSetupInstruments/utils'
import { useDeckConfigurationCompatibility } from '../../../resources/deck_configuration/hooks'

import type {
  CompletedProtocolAnalysis,
  CutoutFixtureId,
  CutoutId,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../utils'
import type { AttachedModule } from '@opentrons/api-client'

interface ProtocolPipette {
  hardwareType: 'pipette'
  pipetteName: PipetteName
  mount: 'left' | 'right'
  connected: boolean
}

interface ProtocolModule {
  hardwareType: 'module'
  moduleModel: ModuleModel
  slot: string
  connected: boolean
  hasSlotConflict: boolean
}

interface ProtocolGripper {
  hardwareType: 'gripper'
  connected: boolean
}

export interface ProtocolFixture {
  hardwareType: 'fixture'
  cutoutFixtureId: CutoutFixtureId | null
  location: { cutout: CutoutId }
  hasSlotConflict: boolean
}

export type ProtocolHardware =
  | ProtocolPipette
  | ProtocolModule
  | ProtocolGripper
  | ProtocolFixture

export const useRequiredProtocolHardwareFromAnalysis = (
  analysis?: CompletedProtocolAnalysis | null
): { requiredProtocolHardware: ProtocolHardware[]; isLoading: boolean } => {
  const {
    data: attachedModulesData,
    isLoading: isLoadingModules,
  } = useModulesQuery()
  const attachedModules = attachedModulesData?.data ?? []

  const {
    data: attachedInstrumentsData,
    isLoading: isLoadingInstruments,
  } = useInstrumentsQuery()
  const attachedInstruments = attachedInstrumentsData?.data ?? []

  const { data: deckConfig } = useDeckConfigurationQuery()
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    FLEX_ROBOT_TYPE,
    analysis?.commands ?? []
  )

  if (analysis == null || analysis?.status !== 'completed') {
    return { requiredProtocolHardware: [], isLoading: true }
  }

  const requiredGripper: ProtocolGripper[] = getProtocolUsesGripper(analysis)
    ? [
        {
          hardwareType: 'gripper',
          connected:
            attachedInstruments.some(i => i.instrumentType === 'gripper') ??
            false,
        },
      ]
    : []

  const handleModuleConnectionCheckFor = (
    attachedModules: AttachedModule[],
    model: ModuleModel
  ): boolean => {
    const ASSUME_ALWAYS_CONNECTED_MODULES = ['magneticBlockV1']

    return !ASSUME_ALWAYS_CONNECTED_MODULES.includes(model)
      ? attachedModules.some(m => m.moduleModel === model)
      : true
  }

  const requiredModules: ProtocolModule[] = analysis.modules.map(
    ({ location, model }) => {
      return {
        hardwareType: 'module',
        moduleModel: model,
        slot: location.slotName,
        connected: handleModuleConnectionCheckFor(attachedModules, model),
        hasSlotConflict:
          deckConfig?.find(
            ({ cutoutId, cutoutFixtureId }) =>
              cutoutId === location.slotName &&
              cutoutFixtureId != null &&
              !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
          ) != null,
      }
    }
  )

  const requiredPipettes: ProtocolPipette[] = analysis.pipettes.map(
    ({ mount, pipetteName }) => ({
      hardwareType: 'pipette',
      pipetteName: pipetteName,
      mount: mount,
      connected:
        attachedInstruments.some(
          i =>
            i.instrumentType === 'pipette' &&
            i.ok &&
            i.mount === mount &&
            i.instrumentName === pipetteName
        ) ?? false,
    })
  )

  const nonSingleSlotDeckConfigCompatibility = deckConfigCompatibility.filter(
    ({ requiredAddressableAreas }) =>
      // required AA list includes a non-single-slot AA
      !requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      )
  )
  // fixture includes at least 1 required AA
  const requiredDeckConfigCompatibility = nonSingleSlotDeckConfigCompatibility.filter(
    fixture => fixture.requiredAddressableAreas.length > 0
  )

  const requiredFixtures = requiredDeckConfigCompatibility.map(
    ({ cutoutFixtureId, cutoutId, compatibleCutoutFixtureIds }) => ({
      hardwareType: 'fixture' as const,
      cutoutFixtureId,
      location: { cutout: cutoutId },
      hasSlotConflict:
        cutoutFixtureId != null &&
        !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
          ? compatibleCutoutFixtureIds.includes(cutoutFixtureId)
          : false,
    })
  )

  return {
    requiredProtocolHardware: [
      ...requiredPipettes,
      ...requiredModules,
      ...requiredGripper,
      ...requiredFixtures,
    ],
    isLoading: isLoadingInstruments || isLoadingModules,
  }
}

/**
 * Returns an array of ProtocolHardware objects that are required by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required hardware is being retrieved.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID.
 */

export const useRequiredProtocolHardware = (
  protocolId: string
): { requiredProtocolHardware: ProtocolHardware[]; isLoading: boolean } => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  return useRequiredProtocolHardwareFromAnalysis(analysis)
}

/**
 * Returns an array of LabwareSetupItem objects that are required by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required labware setup items are being retrieved.
 * @returns {LabwareSetupItem[]} An array of LabwareSetupItem objects that are required by the given protocol ID.
 */
export const useRequiredProtocolLabware = (
  protocolId: string
): LabwareSetupItem[] => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )
  const commands =
    (mostRecentAnalysis as CompletedProtocolAnalysis)?.commands ?? []
  const { onDeckItems, offDeckItems } = getLabwareSetupItemGroups(commands)
  return [...onDeckItems, ...offDeckItems]
}

/**
 * Returns an array of ProtocolHardware objects that are required by the given protocol ID,
 * but not currently connected.
 *
 * @param {ProtocolHardware[]} requiredProtocolHardware An array of ProtocolHardware objects that are required by a protocol.
 * @param {boolean} isLoading A boolean determining whether any required protocol hardware is loading.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID, but not currently connected.
 */

const useMissingProtocolHardwareFromRequiredProtocolHardware = (
  requiredProtocolHardware: ProtocolHardware[],
  isLoading: boolean
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const { data: deckConfig } = useDeckConfigurationQuery()

  // determine missing or conflicted hardware
  return {
    missingProtocolHardware: requiredProtocolHardware.filter(hardware => {
      if ('connected' in hardware) {
        // instruments and modules
        return !hardware.connected
      } else {
        // fixtures
        return !deckConfig?.some(
          ({ cutoutId, cutoutFixtureId }) =>
            hardware.location.cutout === cutoutId &&
            hardware.cutoutFixtureId === cutoutFixtureId
        )
      }
    }),
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

export const useMissingProtocolHardwareFromAnalysis = (
  analysis?: CompletedProtocolAnalysis | null
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const {
    requiredProtocolHardware,
    isLoading,
  } = useRequiredProtocolHardwareFromAnalysis(analysis)

  return useMissingProtocolHardwareFromRequiredProtocolHardware(
    requiredProtocolHardware,
    isLoading
  )
}

export const useMissingProtocolHardware = (
  protocolId: string
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const { requiredProtocolHardware, isLoading } = useRequiredProtocolHardware(
    protocolId
  )

  return useMissingProtocolHardwareFromRequiredProtocolHardware(
    requiredProtocolHardware,
    isLoading
  )
}
