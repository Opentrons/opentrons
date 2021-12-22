import type { PipettingCommand, PipettingCreateCommand } from './pipetting'
import type { GantryCommand, GantryCreateCommand } from './gantry'
import type { ModuleCommand, ModuleCreateCommand } from './module'
import type { SetupCommand, SetupCreateCommand } from './setup'
import type {
  TimingCommand,
  TimingCreateCommand,
  PauseCommand,
  PauseCreateCommand,
} from './timing'

// NOTE: these key/value pairs will only be present on commands at analysis/run time
// they pertain only to the actual execution status of a command on hardware, as opposed to
// the command's identity and parameters which can be known prior to runtime

export type CommandStatus = 'queued' | 'running' | 'succeeded' | 'failed'
interface CommandRunTimeInfo {
  status?: CommandStatus
  error?: string | null
  createdAt?: string
  startedAt?: string
  completedAt?: string
}

// all commands must have an id
export interface CommonCommandInfo extends CommandRunTimeInfo {
  id: string
  result?: any // TODO: gather types for what each command's expected result should be
}

export type CommandCreateData =
  | PipettingCreateCommand // involves the pipettes plunger motor
  | GantryCreateCommand // movement that only effects the x,y,z position of the gantry/pipette
  | ModuleCreateCommand // directed at a hardware module
  | SetupCreateCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
  | TimingCreateCommand // effecting the timing of command execution
  | PauseCreateCommand // effecting the timing of command execution
  | ({
      commandType: 'custom'
      params: { [key: string]: any }
    } & CommonCommandInfo) // allows for experimentation between schema versions with no expectation of system support

// commands will be required to have a key, but will not be created with one
export type Command =
  | PipettingCommand // involves the pipettes plunger motor
  | GantryCommand // movement that only effects the x,y,z position of the gantry/pipette
  | ModuleCommand // directed at a hardware module
  | SetupCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
  | TimingCommand // effecting the timing of command execution
  | PauseCommand // effecting the timing of command execution
  | ({
      commandType: 'custom'
      params: { [key: string]: any }
    } & CommonCommandInfo) // allows for experimentation between schema versions with no expectation of system support
