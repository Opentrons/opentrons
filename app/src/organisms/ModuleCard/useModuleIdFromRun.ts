import { getModuleDef2 } from '@opentrons/shared-data'
import { useAttachedModules } from '../Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import type { AttachedModule } from '../../redux/modules/types'

export interface ModuleIdFromRun {
  moduleIdFromRun: string
}

/**
 * Calculates the module ID from a run for a given module.
 *
 * @param {AttachedModule} module - The module for which to calculate the module ID.
 * @param {string | null} runId - The ID of the run to use for the calculation, or null to use the most recent completed run.
 * @returns {ModuleIdFromRun} - An object containing the calculated module ID.
 */
export function useModuleIdFromRun(
  module: AttachedModule,
  runId: string | null
): ModuleIdFromRun {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const attachedModules = useAttachedModules()

  const { compatibleWith } = getModuleDef2(module.moduleModel)

  const filteredModules = attachedModules.filter(
    item =>
      item.moduleModel === module.moduleModel ||
      compatibleWith.includes(item.moduleModel)
  )

  const loadModuleCommands = robotProtocolAnalysis?.commands.filter(
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
      ? loadModuleCommands?.[moduleIndex].result?.moduleId
      : ''

  return { moduleIdFromRun }
}
