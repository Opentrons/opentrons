import type { RunCommandSummary } from '@opentrons/api-client'
import type { ERROR_KINDS, RECOVERY_MAP, INVALID } from './constants'
import type { ErrorRecoveryWizardProps } from './ErrorRecoveryWizard'

export type FailedCommand = RunCommandSummary
export type InvalidStep = typeof INVALID
export type RecoveryRoute = typeof RECOVERY_MAP[keyof typeof RECOVERY_MAP]['ROUTE']
export type RobotMovingRoute =
  | typeof RECOVERY_MAP['ROBOT_IN_MOTION']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_RESUMING']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_RETRYING_COMMAND']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_CANCELING']['ROUTE']
export type ErrorKind = keyof typeof ERROR_KINDS

interface RecoveryMapDetails {
  ROUTE: string
  STEPS: Record<string, string>
  STEP_ORDER: RouteStep
}

export type RecoveryMap = Record<string, RecoveryMapDetails>
export type StepOrder = {
  [K in RecoveryRoute]: RouteStep[]
}

type RecoveryStep<
  K extends keyof RecoveryMap
> = RecoveryMap[K]['STEPS'][keyof RecoveryMap[K]['STEPS']]

type RobotCancellingRunStep = RecoveryStep<'ROBOT_CANCELING'>
type RobotInMotionStep = RecoveryStep<'ROBOT_IN_MOTION'>
type RobotResumingStep = RecoveryStep<'ROBOT_RESUMING'>
type RobotRetryingCommandStep = RecoveryStep<'ROBOT_RETRYING_COMMAND'>
type BeforeBeginningStep = RecoveryStep<'BEFORE_BEGINNING'>
type CancelRunStep = RecoveryStep<'CANCEL_RUN'>
type DropTipStep = RecoveryStep<'DROP_TIP'>
type IgnoreAndResumeStep = RecoveryStep<'IGNORE_AND_RESUME'>
type RefillAndResumeStep = RecoveryStep<'REFILL_AND_RESUME'>
type ResumeStep = RecoveryStep<'RESUME'>
type OptionSelectionStep = RecoveryStep<'OPTION_SELECTION'>

export type RouteStep =
  | RobotInMotionStep
  | RobotResumingStep
  | RobotRetryingCommandStep
  | BeforeBeginningStep
  | CancelRunStep
  | DropTipStep
  | IgnoreAndResumeStep
  | ResumeStep
  | OptionSelectionStep
  | RefillAndResumeStep
  | RobotCancellingRunStep

export interface IRecoveryMap {
  route: RecoveryRoute
  step: RouteStep
}

export type RecoveryContentProps = ErrorRecoveryWizardProps & {
  errorKind: ErrorKind
  isOnDevice: boolean
}
