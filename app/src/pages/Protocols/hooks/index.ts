import last from 'lodash/last'
import partition from 'lodash/partition'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  useAttachedModules,
  useAttachedPipettes,
} from '../../../organisms/Devices/hooks'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ModuleModel,
  PipetteName,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  LabwareLocation,
  LoadModuleRunTimeCommand,
  ModuleLocation,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export interface LabwareSetupItem {
  definition: LabwareDefinition2
  nickName: string | null
  initialLocation: LabwareLocation
  moduleModel: ModuleModel | null
  moduleLocation: ModuleLocation | null
}

export interface GroupedLabwareSetupItems {
  onDeckItems: LabwareSetupItem[]
  offDeckItems: LabwareSetupItem[]
}

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

export function getLabwareSetupItemGroups(
  commands: RunTimeCommand[]
): GroupedLabwareSetupItems {
  let beyondInitialLoadCommands = false

  const LABWARE_ACCESS_COMMAND_TYPES = [
    'moveToWell',
    'aspirate',
    'dispense',
    'blowout',
    'pickUpTip',
    'dropTip',
    'touchTip',
  ]

  const [offDeckItems, onDeckItems] = partition(
    commands.reduce<LabwareSetupItem[]>((acc, c) => {
      if (
        c.commandType === 'loadLabware' &&
        c.result?.definition?.metadata?.displayCategory !== 'trash'
      ) {
        const { location, displayName } = c.params
        const { definition } = c.result ?? {}
        if (definition == null) return acc
        let moduleModel = null
        let moduleLocation = null
        if (location !== 'offDeck' && 'moduleId' in location) {
          const loadModuleCommand = commands.find(
            (c): c is LoadModuleRunTimeCommand =>
              c.commandType === 'loadModule' &&
              c.result?.moduleId === location.moduleId
          )
          if (loadModuleCommand == null) {
            console.error(
              `could not find load module command for module with id ${String(
                location.moduleId
              )}`
            )
          } else {
            moduleModel = loadModuleCommand.params.model
            moduleLocation = loadModuleCommand.params.location
          }
        }
        // NOTE: params.displayName is the user-assigned nickName, different from labareDisplayName from def
        const nickName =
          displayName != null &&
          displayName !== getLabwareDisplayName(definition)
            ? displayName
            : null

        return [
          ...acc,
          {
            // NOTE: for the purposes of the labware setup step, anything loaded after
            // the initial load commands will be treated as "initially off deck"
            // even if technically loaded directly onto the deck later in the protocol
            initialLocation: beyondInitialLoadCommands
              ? 'offDeck'
              : c.params.location,
            definition,
            moduleModel,
            moduleLocation,
            nickName,
          },
        ]
      } else if (
        !beyondInitialLoadCommands &&
        LABWARE_ACCESS_COMMAND_TYPES.includes(c.commandType) &&
        !(
          c.commandType === 'moveLabware' &&
          c.params.strategy === 'manualMoveWithoutPause'
        )
      ) {
        beyondInitialLoadCommands = true
      }

      return acc
    }, []),
    ({ initialLocation }) => initialLocation === 'offDeck'
  )
  return { onDeckItems, offDeckItems }
}

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
