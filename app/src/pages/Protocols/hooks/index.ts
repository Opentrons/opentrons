import last from 'lodash/last'
import {
  useDeckConfigurationQuery,
  useInstrumentsQuery,
  useModulesQuery,
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import { STANDARD_SLOT_LOAD_NAME } from '@opentrons/shared-data'
import { getLabwareSetupItemGroups } from '../utils'
import { getProtocolUsesGripper } from '../../../organisms/ProtocolSetupInstruments/utils'
import { useFeatureFlag } from '../../../redux/config'

import type {
  CompletedProtocolAnalysis,
  Cutout,
  FixtureLoadName,
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

interface ProtocolFixture {
  hardwareType: 'fixture'
  fixtureName: FixtureLoadName
  location: { cutout: Cutout }
}

export type ProtocolHardware =
  | ProtocolPipette
  | ProtocolModule
  | ProtocolGripper
  | ProtocolFixture

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
  const enableDeckConfigurationFeatureFlag = useFeatureFlag(
    'enableDeckConfiguration'
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
        hasSlotConflict: !!deckConfig?.find(
          fixture =>
            fixture.fixtureLocation === location.slotName &&
            fixture.loadName !== STANDARD_SLOT_LOAD_NAME
        ),
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

  //  TODO(jr, 10/2/23): IMMEDIATELY delete the stubs when api supports
  //  loadFixture
  // const requiredFixture: ProtocolFixture[] = analysis.commands
  //   .filter(
  //     (command): command is LoadFixtureRunTimeCommand =>
  //       command.commandType === 'loadFixture'
  //   )
  //   .map(({ params }) => {
  //     return {
  //       hardwareType: 'fixture',
  //       fixtureName: params.loadName,
  //       location: params.location,
  //     }
  //   })
  const STUBBED_FIXTURES: ProtocolFixture[] = [
    {
      hardwareType: 'fixture',
      fixtureName: 'wasteChute',
      location: { cutout: 'D3' },
    },
    {
      hardwareType: 'fixture',
      fixtureName: 'standardSlot',
      location: { cutout: 'C3' },
    },
    {
      hardwareType: 'fixture',
      fixtureName: 'stagingArea',
      location: { cutout: 'B3' },
    },
  ]
  return {
    requiredProtocolHardware: enableDeckConfigurationFeatureFlag
      ? [
          ...requiredPipettes,
          ...requiredModules,
          ...requiredGripper,
          // ...requiredFixture,
          ...STUBBED_FIXTURES,
        ]
      : [
          ...requiredPipettes,
          ...requiredModules,
          ...requiredGripper,
          // ...requiredFixture,
        ],
    isLoading: isLoadingInstruments || isLoadingModules,
  }
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
 * @param {string} protocolId The ID of the protocol for which required but missing hardware is being retrieved.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID,
 * but not currently connected.
 */
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
  return {
    missingProtocolHardware: requiredProtocolHardware.filter(
      hardware => 'connected' in hardware && !hardware.connected
    ),
    conflictedSlots: requiredProtocolHardware
      .filter(
        (hardware): hardware is ProtocolModule =>
          hardware.hardwareType === 'module' && hardware.hasSlotConflict
      )
      .map(mod => mod.slot),
    isLoading,
  }
}
