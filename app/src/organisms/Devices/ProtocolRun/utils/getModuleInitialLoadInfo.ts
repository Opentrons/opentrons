import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  LoadModuleRunTimeCommand,
  ModuleLocation,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

interface ModuleInitialLoadInfo {
  location: ModuleLocation
  protocolLoadOrder: number
}
export const getModuleInitialLoadInfo = (
  moduleId: string,
  commands: RunTimeCommand[]
): ModuleInitialLoadInfo => {
  const moduleLoadIndex = commands.findIndex(
    (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
      command.commandType === 'loadModule' &&
      command.result?.moduleId === moduleId
  )

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
    location: (commands[moduleLoadIndex] as LoadModuleRunTimeCommand).params
      .location,
    protocolLoadOrder,
  }
}
