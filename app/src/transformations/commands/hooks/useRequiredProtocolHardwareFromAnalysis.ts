import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutFixtureIdsForModuleModel,
  getCutoutFixturesForModuleModel,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
} from '@opentrons/shared-data'

import {
  getFilteredDeckConfigFixtureCompatibility,
  useDeckConfigurationCompatibility,
  useNotifyDeckConfigurationQuery,
} from '/app/resources/deck_configuration'

import { getProtocolUsesGripper } from '../transformations'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type {
  ProtocolGripper,
  ProtocolHardware,
  ProtocolModule,
  ProtocolPipette,
} from './types'

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
  const deckConfig =
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    })?.data ?? []
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

  const requiredModules: ProtocolModule[] = analysis.modules
    // remove magnetic blocks, they're handled by required fixtures
    .filter(m => getModuleType(m.model) !== MAGNETIC_BLOCK_TYPE)
    .map(({ location, model }) => {
      const cutoutIdForSlotName = getCutoutIdForSlotName(
        location.slotName,
        deckDef
      )
      const moduleType = getModuleType(model)
      const fixtureD3 = deckConfigCompatibility.find(
        fixture => fixture.cutoutId === 'cutoutD3'
      )
      const comboFixtureId =
        moduleType === FLEX_STACKER_MODULE_TYPE &&
        location.slotName === 'D3' &&
        fixtureD3 != null
          ? fixtureD3.cutoutFixtureId
          : null
      const moduleFixtures = getCutoutFixturesForModuleModel(model, deckDef)

      const configuredModuleSerialNumber =
        deckConfig.find(
          ({ cutoutId, cutoutFixtureId }) =>
            cutoutId === cutoutIdForSlotName &&
            moduleFixtures.map(mf => mf.id).includes(cutoutFixtureId)
        )?.opentronsModuleSerialNumber ?? null
      const isConnected = moduleFixtures.every(
        mf => mf.expectOpentronsModuleSerialNumber
      )
        ? attachedModules.some(
            m =>
              m.moduleModel === model &&
              m.serialNumber === configuredModuleSerialNumber
          )
        : true
      return {
        hardwareType: 'module',
        moduleModel: model,
        slot: location.slotName,
        comboFixtureId,
        connected: isConnected,
        hasSlotConflict: deckConfig.some(
          ({ cutoutId, cutoutFixtureId }) =>
            cutoutId === getCutoutIdForSlotName(location.slotName, deckDef) &&
            !getCutoutFixtureIdsForModuleModel(model).includes(cutoutFixtureId)
        ),
      }
    })

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
  const filteredDeckConfigCompatibility = getFilteredDeckConfigFixtureCompatibility(
    requiredDeckConfigCompatibility
  )

  const requiredFixtures = filteredDeckConfigCompatibility.map(
    ({
      cutoutFixtureId,
      compatibleCutoutFixtureIds,
      cutoutId,
      partialRequiredCutoutFixtureId,
    }) => {
      return {
        hardwareType: 'fixture' as const,
        cutoutFixtureId:
          partialRequiredCutoutFixtureId ?? compatibleCutoutFixtureIds[0],
        location: { cutout: cutoutId },
        hasSlotConflict:
          cutoutFixtureId != null &&
          !compatibleCutoutFixtureIds.includes(cutoutFixtureId),
      }
    }
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
