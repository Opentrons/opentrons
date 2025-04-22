import type { GetCommandText, UseCommandTextStringParams } from '..'
import type {
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  RunTimeCommand,
} from '@opentrons/shared-data'

export type HandlesCommands<T extends RunTimeCommand> = Omit<
  GetCommandText,
  'command'
> &
  UseCommandTextStringParams & { command: T }

export type LoadedPipettes = LoadedPipette[] | Record<string, LoadedPipette>

export type LoadedLabwares = LoadedLabware[] | Record<string, LoadedLabware>

export type LoadedModules = LoadedModule[] | Record<string, LoadedModule>
