import type { Command } from '@opentrons/shared-data'
import type {
  LoadModuleCommand,
  ModuleLocation,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

interface ModuleInitialLoadInfo {
  location: ModuleLocation
  protocolLoadOrder: number
}
export const getModuleInitialLoadInfo = (
  moduleId: string,
  commands: Command[]
): ModuleInitialLoadInfo => {
  const moduleLoadIndex = commands.findIndex(
    (command: Command): command is LoadModuleCommand =>
      command.commandType === 'loadModule' &&
      command.params.moduleId === moduleId
  )
  ;('3e039550-3412-11eb-ad93-ed232a2337cf:temperatureModuleType2')
  ;('3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType2')

  if (moduleLoadIndex === -1) {
    throw new Error(
      'expected to be able to find module location, but could not'
    )
  }

  const protocolLoadOrder = commands
    .slice(0, moduleLoadIndex)
    .reduce(
      (moduleLoadCount, command) =>
        command.commandType === 'loadModule'
          ? moduleLoadCount + 1
          : moduleLoadCount,
      0
    )

  return {
    location: (commands[moduleLoadIndex] as LoadModuleCommand).params.location,
    protocolLoadOrder,
  }
}
