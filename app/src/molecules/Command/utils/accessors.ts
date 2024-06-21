import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export function getLoadedLabware(
  commandTextData: CompletedProtocolAnalysis | RunData | CommandTextData,
  labwareId: string
): LoadedLabware | undefined {
  // NOTE: old analysis contains a object dictionary of labware entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(commandTextData.labware)
    ? commandTextData.labware.find(l => l.id === labwareId)
    : commandTextData.labware[labwareId]
}
export function getLoadedPipette(
  commandTextData: CommandTextData,
  mount: string
): LoadedPipette | undefined {
  // NOTE: old analysis contains a object dictionary of pipette entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(commandTextData.pipettes)
    ? commandTextData.pipettes.find(l => l.mount === mount)
    : commandTextData.pipettes[mount]
}
export function getLoadedModule(
  commandTextData: CompletedProtocolAnalysis | RunData | CommandTextData,
  moduleId: string
): LoadedModule | undefined {
  // NOTE: old analysis contains a object dictionary of module entities by id, this case is supported for backwards compatibility purposes
  return Array.isArray(commandTextData.modules)
    ? commandTextData.modules.find(l => l.id === moduleId)
    : commandTextData.modules[moduleId]
}
