import type {
  PipettingRunTimeCommand,
  PipettingCreateCommand,
} from './pipetting'
import type { GantryRunTimeCommand, GantryCreateCommand } from './gantry'
import type { ModuleRunTimeCommand, ModuleCreateCommand } from './module'
import type { SetupRunTimeCommand, SetupCreateCommand } from './setup'
import type { TimingRunTimeCommand, TimingCreateCommand } from './timing'
import type {
  IncidentalCreateCommand,
  IncidentalRunTimeCommand,
} from './incidental'
import type {
  AnnotationRunTimeCommand,
  AnnotationCreateCommand,
} from './annotation'
import type {
  CalibrationRunTimeCommand,
  CalibrationCreateCommand,
} from './calibration'

export * from './annotation'
export * from './calibration'
export * from './gantry'
export * from './incidental'
export * from './module'
export * from './pipetting'
export * from './setup'
export * from './timing'

// NOTE: these key/value pairs will only be present on commands at analysis/run time
// they pertain only to the actual execution status of a command on hardware, as opposed to
// the command's identity and parameters which can be known prior to runtime
export interface CommandNote {
  noteKind: 'warning' | 'information' | string
  shortMessage: string
  longMessage: string
  source: string
}
export type CommandStatus = 'queued' | 'running' | 'succeeded' | 'failed'
export type CommandIntent = 'protocol' | 'setup' | 'fixit'
export interface CommonCommandRunTimeInfo {
  key?: string
  id: string
  status: CommandStatus
  error?: RunCommandError | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  intent?: CommandIntent
  notes?: CommandNote[] | null
  failedCommandId?: string // only present if intent === 'fixit'
}
export interface CommonCommandCreateInfo {
  intent?: CommandIntent
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

// TODO(jh, 05-24-24): Update when some of these newer properties become more finalized.
export interface RunCommandError {
  createdAt: string
  detail: string
  errorCode: string
  errorType: string
  id: string
  isDefined: boolean
  errorInfo?: Record<string, unknown>
  wrappedErrors?: RunCommandError[]
}
