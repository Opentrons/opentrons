import type { ErrorCodes } from '../../errors'
import type {
  AnnotationCreateCommand,
  AnnotationRunTimeCommand,
} from './annotation'
import type {
  CalibrationCreateCommand,
  CalibrationRunTimeCommand,
} from './calibration'
import type {
  ConcurrentCreateCommand,
  ConcurrentRunTimeCommand,
} from './concurrent'
import type {
  RobotDevicesCreateCommand,
  RobotDevicesRunTimeCommand,
} from './devices'
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
import type { RobotCreateCommand, RobotRunTimeCommand } from './robot'
import type { SetupCreateCommand, SetupRunTimeCommand } from './setup'
import type { TimingCreateCommand, TimingRunTimeCommand } from './timing'
import type { UnsafeCreateCommand, UnsafeRunTimeCommand } from './unsafe'

export * from './annotation'
export * from './calibration'
export * from './gantry'
export * from './incidental'
export * from './module'
export * from './pipetting'
export * from './setup'
export * from './timing'
export * from './unsafe'
export * from './support'
export * from './robot'
export * from './concurrent'
export * from './devices'
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
export interface CommonCommandRunTimeInfo<
  DefinedErrorsT extends DefinedRunCommandError = DefinedRunCommandError,
> {
  key?: string
  id: string
  status: CommandStatus
  error?: RunCommandErrorUndefined | DefinedErrorsT | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  intent?: CommandIntent
  notes?: CommandNote[] | null
  failedCommandId?: string // only present if intent === 'fixit'
  commandAnnotationIds?: string[]
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
  | UnsafeCreateCommand // command providing capabilities that are not safe for scientific uses
  | RobotCreateCommand // command providing underlying robot capabilities outside the normal model
  | ConcurrentCreateCommand // command providing concurrent actions
  | RobotDevicesCreateCommand // commands that interface with robot devices

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
  | UnsafeRunTimeCommand // command providing capabilities that are not safe for scientific uses
  | RobotRunTimeCommand // command providing underlying robot capabilities outside the normal model
  | ConcurrentRunTimeCommand // command providing concurrent actions
  | RobotDevicesRunTimeCommand // commands that interface with robot devices

export type RunCommandError = RunCommandErrorUndefined | DefinedRunCommandError

export type DefinedRunCommandError =
  RunCommandRobotActionError | RunCommandFlexStackerError

export type RunCommandRobotActionError =
  RunCommandErrorOverpressure | RunCommandErrorTipPhysicallyAttached

export type Failed<CommandT extends RunTimeCommand> = Omit<CommandT, 'result'>

// TODO(jh, 05-24-24): Update when some of these newer properties become more finalized.
export interface RunCommandErrorBase {
  createdAt: string
  detail: string
  id: string
  wrappedErrors?: RunCommandError[]
}

export interface RunCommandErrorUndefined extends RunCommandErrorBase {
  errorCode: ErrorCodes
  errorType: string
  isDefined: boolean
  errorInfo?: Record<string, unknown>
}

export interface RunCommandErrorOverpressure extends RunCommandErrorBase {
  errorCode: '3006'
  errorType: 'overpressure'
  isDefined: true
  errorInfo: { retryLocation: [number, number, number] }
}

export interface RunCommandErrorTipPhysicallyAttached extends RunCommandErrorBase {
  errorCode: '3004'
  errorType: 'tipPhysicallyAttached'
  isDefined: true
  errorInfo: { retryLocation: [number, number, number] }
}

export interface RunCommandErrorFlexStackerStall extends RunCommandErrorBase {
  errorCode: '2019'
  errorType: 'flexStackerStallOrCollision'
  isDefined: true
  errorInfo: { labwareId?: string }
}

export interface RunCommandErrorFlexStackerShuttleMissing extends RunCommandErrorBase {
  errorCode: '3020'
  errorType: 'flexStackerShuttleMissing'
  isDefined: true
  errorInfo: { labwareId?: string }
}

export interface RunCommandErrorFlexStackerShuttleLabware extends RunCommandErrorBase {
  errorCode: '3021'
  errorType: 'flexStackerLabwareRetrieveFailed'
  isDefined: true
  errorInfo: { labwareId?: string }
}

export interface RunCommandErrorFlexStackerHopperLabware extends RunCommandErrorBase {
  errorCode: '3022'
  errorType: 'flexStackerHopperLabwareFailed'
  isDefined: true
  errorInfo: { labwareId?: string }
}

export interface RunCommandErrorFlexStackerShuttleOccupied extends RunCommandErrorBase {
  errorCode: '3023'
  errorType: 'flexStackerShuttleOccupied'
  isDefined: true
  errorInfo: { labwareId?: string }
}

export type RunCommandFlexStackerError =
  | RunCommandErrorFlexStackerStall
  | RunCommandErrorFlexStackerShuttleMissing
  | RunCommandErrorFlexStackerHopperLabware
  | RunCommandErrorFlexStackerShuttleLabware
  | RunCommandErrorFlexStackerShuttleOccupied
