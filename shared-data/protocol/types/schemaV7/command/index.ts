import type {
  AnnotationCreateCommand,
  AnnotationRunTimeCommand,
} from './annotation'
import type {
  CalibrationCreateCommand,
  CalibrationRunTimeCommand,
} from './calibration'
import type { GantryCreateCommand, GantryRunTimeCommand } from './gantry'
import type {
  IncidentalCreateCommand,
  IncidentalRunTimeCommand,
} from './incidental'
import type { ModuleCreateCommand, ModuleRunTimeCommand } from './module'
import type {
  PipettingCreateCommand,
  PipettingRunTimeCommand,
} from './pipetting'
import type { SetupCreateCommand, SetupRunTimeCommand } from './setup'
import type { TimingCreateCommand, TimingRunTimeCommand } from './timing'

export * from './annotation'
export * from './calibration'
export * from './gantry'
export * from './module'
export * from './pipetting'
export * from './setup'
export * from './timing'

// NOTE: these key/value pairs will only be present on commands at analysis/run time
// they pertain only to the actual execution status of a command on hardware, as opposed to
// the command's identity and parameters which can be known prior to runtime

export type CommandStatus = 'queued' | 'running' | 'succeeded' | 'failed'
export interface CommonCommandRunTimeInfo {
  key?: string
  id: string
  status: CommandStatus
  error?: RunCommandError | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  intent?: 'protocol' | 'setup'
}
export interface CommonCommandCreateInfo {
  key?: string
  meta?: { [key: string]: any }
}

export type CreateCommand =
  | PipettingCreateCommand // involves the pipettes plunger motor
  | GantryCreateCommand // movement that only effects the x,y,z position of the gantry/pipette
  | ModuleCreateCommand // directed at a hardware module
  | SetupCreateCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
  | TimingCreateCommand // effecting the timing of command execution
  | CalibrationCreateCommand // for automatic pipette calibration
  | AnnotationCreateCommand // annotating command execution
  | IncidentalCreateCommand // command with only incidental effects (status bar animations)

// commands will be required to have a key, but will not be created with one
export type RunTimeCommand =
  | PipettingRunTimeCommand // involves the pipettes plunger motor
  | GantryRunTimeCommand // movement that only effects the x,y,z position of the gantry/pipette
  | ModuleRunTimeCommand // directed at a hardware module
  | SetupRunTimeCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
  | TimingRunTimeCommand // effecting the timing of command execution
  | CalibrationRunTimeCommand // for automatic pipette calibration
  | AnnotationRunTimeCommand // annotating command execution
  | IncidentalRunTimeCommand // command with only incidental effects (status bar animations)

interface RunCommandError {
  id: string
  errorType: string
  createdAt: string
  detail: string
}
