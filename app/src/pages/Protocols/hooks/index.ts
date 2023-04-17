import last from 'lodash/last'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
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

export type ProtocolHardware = ProtocolPipette | ProtocolModule

export const useRequiredProtocolHardware = (
  protocolId: string
): ProtocolHardware[] => {
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null
  const attachedModules = useAttachedModules()
  const attachedPipettes = useAttachedPipettes()

  if (
    mostRecentAnalysis == null ||
    mostRecentAnalysis?.status !== 'completed'
  ) {
    return []
  }

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

  return [...requiredPipettes, ...requiredModules]
}

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
