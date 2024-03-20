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
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  RunTimeParameter,
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
  ProtocolAnalysisOutput,
  RobotType,
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

const DECK_CONFIG_REFETCH_INTERVAL = 5000

export const useRequiredProtocolHardwareFromAnalysis = (
  analysis: CompletedProtocolAnalysis | null
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

  const robotType = FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)
  const { data: deckConfig = [] } = useDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    analysis
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
        hasSlotConflict: deckConfig.some(
          ({ cutoutId, cutoutFixtureId }) =>
            cutoutId === getCutoutIdForSlotName(location.slotName, deckDef) &&
            cutoutFixtureId != null &&
            !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
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

  // fixture includes at least 1 required addressableArea AND it doesn't ONLY include a single slot addressableArea
  const requiredDeckConfigCompatibility = deckConfigCompatibility.filter(
    ({ requiredAddressableAreas }) => {
      const atLeastOneAA = requiredAddressableAreas.length > 0
      const notOnlySingleSlot = !(
        requiredAddressableAreas.length === 1 &&
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(requiredAddressableAreas[0])
      )
      return atLeastOneAA && notOnlySingleSlot
    }
  )

  const requiredFixtures = requiredDeckConfigCompatibility.map(
    ({ cutoutFixtureId, cutoutId, compatibleCutoutFixtureIds }) => ({
      hardwareType: 'fixture' as const,
      cutoutFixtureId: compatibleCutoutFixtureIds[0],
      location: { cutout: cutoutId },
      hasSlotConflict:
        cutoutFixtureId != null &&
        !compatibleCutoutFixtureIds.includes(cutoutFixtureId),
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
 * Returns an array of RunTimeParameters objects that are optional by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required hardware is being retrieved.
 * @returns {RunTimeParameters[]} An array of RunTimeParameters objects that are required by the given protocol ID.
 */

export const useRunTimeParameters = (
  protocolId: string
): RunTimeParameter[] => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  const mockData: RunTimeParameter[] = [
    {
      value: false,
      displayName: 'Dry Run',
      variableName: 'DRYRUN',
      description: 'Is this a dry or wet run? Wet is true, dry is false',
      type: 'boolean',
      default: false,
    },
    {
      value: true,
      displayName: 'Use Gripper',
      variableName: 'USE_GRIPPER',
      description: 'For using the gripper.',
      type: 'boolean',
      default: true,
    },
    {
      value: true,
      displayName: 'Trash Tips',
      variableName: 'TIP_TRASH',
      description:
        'to throw tip into the trash or to not throw tip into the trash',
      type: 'boolean',
      default: true,
    },
    {
      value: true,
      displayName: 'Deactivate Temperatures',
      variableName: 'DEACTIVATE_TEMP',
      description: 'deactivate temperature on the module',
      type: 'boolean',
      default: true,
    },
    {
      value: 4,
      displayName: 'Columns of Samples',
      variableName: 'COLUMNS',
      description: 'How many columns do you want?',
      type: 'int',
      min: 1,
      max: 14,
      default: 4,
    },
    {
      value: 6,
      displayName: 'PCR Cycles',
      variableName: 'PCR_CYCLES',
      description: 'number of PCR cycles on a thermocycler',
      type: 'int',
      min: 1,
      max: 10,
      default: 6,
    },
    {
      value: 6.5,
      displayName: 'EtoH Volume',
      variableName: 'ETOH_VOLUME',
      description: '70% ethanol volume',
      type: 'float',
      suffix: 'mL',
      min: 1.5,
      max: 10.0,
      default: 6.5,
    },
    {
      value: 'none',
      displayName: 'Default Module Offsets',
      variableName: 'DEFAULT_OFFSETS',
      description: 'default module offsets for temp, H-S, and none',
      type: 'str',
      choices: [
        {
          displayName: 'No offsets',
          value: 'none',
        },
        {
          displayName: 'temp offset',
          value: '1',
        },
        {
          displayName: 'heater-shaker offset',
          value: '2',
        },
      ],
      default: 'none',
    },
    {
      value: 'left',
      displayName: 'pipette mount',
      variableName: 'mont',
      description: 'pipette mount',
      type: 'str',
      choices: [
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Right',
          value: 'right',
        },
      ],
      default: 'left',
    },
    {
      value: 'flex',
      displayName: 'short test case',
      variableName: 'short 2 options',
      description: 'this play 2 short options',
      type: 'str',
      choices: [
        {
          displayName: 'OT-2',
          value: 'ot2',
        },
        {
          displayName: 'Flex',
          value: 'flex',
        },
      ],
      default: 'flex',
    },
    {
      value: 'flex',
      displayName: 'long test case',
      variableName: 'long 2 options',
      description: 'this play 2 long options',
      type: 'str',
      choices: [
        {
          displayName: 'I am kind of long text version',
          value: 'ot2',
        },
        {
          displayName: 'I am kind of long text version. Today is 3/15',
          value: 'flex',
        },
      ],
      default: 'flex',
    },
  ]
  //  TODO(jr, 3/14/24): remove the mockData
  return analysis?.runTimeParameters ?? mockData
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

  return useRequiredProtocolHardwareFromAnalysis(analysis ?? null)
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
          ({ cutoutFixtureId, compatibleCutoutFixtureIds }) =>
            cutoutFixtureId != null &&
            !compatibleCutoutFixtureIds.some(id => id === cutoutFixtureId)
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

export const useMissingProtocolHardwareFromAnalysis = (
  robotType: RobotType,
  analysis: CompletedProtocolAnalysis | null
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
    isLoading,
    robotType,
    analysis ?? null
  )
}

export const useMissingProtocolHardware = (
  protocolId: string
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )
  const {
    requiredProtocolHardware,
    isLoading,
  } = useRequiredProtocolHardwareFromAnalysis(analysis ?? null)

  return useMissingProtocolHardwareFromRequiredProtocolHardware(
    requiredProtocolHardware,
    isLoading,
    FLEX_ROBOT_TYPE,
    analysis ?? null
  )
}
