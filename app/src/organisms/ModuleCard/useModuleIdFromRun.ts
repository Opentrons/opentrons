import { getModuleDef2 } from '@opentrons/shared-data'
import { useAttachedModules, useProtocolDetailsForRun } from '../Devices/hooks'
import type { AttachedModule } from '../../redux/modules/types'

export interface ModuleIdFromRun {
  moduleIdFromRun: string
}

export function useModuleIdFromRun(
  module: AttachedModule,
  runId: string | null
): ModuleIdFromRun {
  const { protocolData } = useProtocolDetailsForRun(runId)
  const attachedModules = useAttachedModules()

  const { compatibleWith } = getModuleDef2(module.moduleModel)

  const filteredModules = attachedModules.filter(
    item =>
      item.moduleModel === module.moduleModel ||
      compatibleWith.includes(item.moduleModel)
  )

  const loadModuleCommands = protocolData?.commands.filter(
    command =>
      command.commandType === 'loadModule' &&
      (command.params.model === module.moduleModel ||
        compatibleWith.includes(command.params.model))
  )

  const moduleIndex = filteredModules.findIndex(
    attachedModule => attachedModule.serialNumber === module.serialNumber
  )

  const moduleIdFromRun =
    loadModuleCommands?.[moduleIndex] != null
      ? loadModuleCommands?.[moduleIndex].result.moduleId
      : ''

  if (moduleIdFromRun === '') {
    console.error(
      `there is no specific module id associated with the attached module ${module.moduleModel} passed in the hook`
    )
  }

  return { moduleIdFromRun }
}
