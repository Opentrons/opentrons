import { useProtocolDetailsForRun } from '../hooks'

export interface ModuleIdsFromRun {
  moduleIdsFromRun: string[]
}

export function useHeaterShakerModuleIdsFromRun(
  runId: string | null
): ModuleIdsFromRun {
  const { protocolData } = useProtocolDetailsForRun(runId)

  const loadModuleCommands = protocolData?.commands.filter(
    command =>
      command.commandType === 'loadModule' &&
      command.params.model === 'heaterShakerModuleV1'
  )

  const moduleIdsFromRun =
    loadModuleCommands != null
      ? loadModuleCommands?.map(command => command.result.moduleId)
      : []

  return { moduleIdsFromRun }
}
