import { useAttachedModules, useProtocolDetailsForRun } from '../hooks'
import type { AttachedModule } from '../../../redux/modules/types'

export interface ModuleIdFromRun {
  moduleIdFromRun: string
}

export function useModuleIdFromRun(
  robotName: string,
  module: AttachedModule,
  runId: string | null
): ModuleIdFromRun {
  const { protocolData } = useProtocolDetailsForRun(runId)
  const attachedModules = useAttachedModules(robotName)

  const filteredModules = attachedModules.filter(
    item =>
      item.moduleModel === module.moduleModel &&
      item.serialNumber === module.serialNumber
  )
  const loadModuleCommands = protocolData?.commands.filter(
    command =>
      command.commandType === 'loadModule' &&
      command.params.model === module.moduleModel
  )
  const moduleIdFromRun =
    loadModuleCommands != null &&
    loadModuleCommands[filteredModules.indexOf(module)].result.moduleId

  return { moduleIdFromRun }
}
