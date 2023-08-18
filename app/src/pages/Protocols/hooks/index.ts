import last from 'lodash/last'
import {
  useInstrumentsQuery,
  useProtocolAnalysesQuery,
} from '@opentrons/react-api-client'
import {
  useAttachedModules,
  useAttachedPipettes,
} from '../../../organisms/Devices/hooks'
import { getLabwareSetupItemGroups } from '../utils'

import type {
  CompletedProtocolAnalysis,
  ModuleModel,
  PipetteName,
} from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../utils'
import { getProtocolUsesGripper } from '../../../organisms/ProtocolSetupInstruments/utils'

interface ProtocolPipette {
  hardwareType: 'pipette'
  pipetteName: PipetteName
  mount: 'left' | 'right'
  connected: boolean
}

// TODO: change this to new slot naming system with an imported type from shared data
type Slot = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11'

interface ProtocolModule {
  hardwareType: 'module'
  moduleModel: ModuleModel
  slot: Slot
  connected: boolean
}

interface ProtocolGripper {
  hardwareType: 'gripper'
  connected: boolean
}

export type ProtocolHardware =
  | ProtocolPipette
  | ProtocolModule
  | ProtocolGripper

/**
 * Returns an array of ProtocolHardware objects that are required by the given protocol ID.
 *
 * @param {string} protocolId The ID of the protocol for which required hardware is being retrieved.
 * @returns {ProtocolHardware[]} An array of ProtocolHardware objects that are required by the given protocol ID.
 */
export const useRequiredProtocolHardware = (
  protocolId: string
): ProtocolHardware[] => {
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null
  const attachedModules = useAttachedModules()
  const attachedPipettes = useAttachedPipettes()
  const { data: instrumentsData } = useInstrumentsQuery()

  if (
    mostRecentAnalysis == null ||
    mostRecentAnalysis?.status !== 'completed'
  ) {
    return []
  }

  const requiredGripper: ProtocolGripper[] = getProtocolUsesGripper(
    mostRecentAnalysis
  )
    ? [
        {
          hardwareType: 'gripper',
          connected:
            instrumentsData?.data.some(i => i.instrumentType === 'gripper') ??
            false,
        },
      ]
    : []

  const requiredModules: ProtocolModule[] = mostRecentAnalysis.modules.map(
    ({ location, model }) => {
      return {
        hardwareType: 'module',
        moduleModel: model,
        slot: location.slotName as Slot,
        // TODO: check module compatability using brent's changes when they're in edge
        connected: attachedModules.some(m => m.moduleModel === model),
      }
    }
  )

  const requiredPipettes: ProtocolPipette[] = mostRecentAnalysis.pipettes.map(
    ({ mount, pipetteName }) => ({
      hardwareType: 'pipette',
      pipetteName: pipetteName,
      mount: mount,
      connected: attachedPipettes[mount]?.name === pipetteName,
    })
  )

  return [...requiredPipettes, ...requiredModules, ...requiredGripper]
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
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null
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
): ProtocolHardware[] => {
  const requiredProtocolHardware = useRequiredProtocolHardware(protocolId)
  return requiredProtocolHardware.filter(hardware => !hardware.connected)
}
