import type { RunCommandSummary } from '@opentrons/api-client'
import type { ERROR_KINDS, INVALID, RECOVERY_MAP } from './constants'
import type { ErrorRecoveryWizardProps } from './ErrorRecoveryWizard'
import type {
  DropTipFlowsRoute,
  DropTipFlowsStep,
} from '/app/organisms/DropTipWizardFlows/types'

/**
 * Misc Recovery Types
 */
export type FailedCommand = RunCommandSummary
export type ErrorKind = typeof ERROR_KINDS[keyof typeof ERROR_KINDS]

/**
 * Prop Specific Types
 */
export type RecoveryContentProps = ErrorRecoveryWizardProps & {
  errorKind: ErrorKind
  isOnDevice: boolean
}

/**
 * Drop Tip Specific Types
 */
export type ValidDropTipSubRoutes = DropTipFlowsRoute
export type ValidDropTipSubSteps = DropTipFlowsStep
export interface ValidDropTipSubMap {
  route: ValidDropTipSubRoutes
  step: ValidDropTipSubSteps | null
}

/**
 * Recovery Map Types
 */
export interface IRecoveryMap {
  route: RecoveryRoute
  step: RouteStep
}
type RecoveryMap = typeof RECOVERY_MAP
export type InvalidStep = typeof INVALID
export type RouteKey = RecoveryMap[keyof RecoveryMap]['ROUTE']
export type RecoveryRoute = RouteKey
export type RobotMovingRoute =
  | typeof RECOVERY_MAP['ROBOT_IN_MOTION']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_RESUMING']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_RETRYING_STEP']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_CANCELING']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_PICKING_UP_TIPS']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_SKIPPING_STEP']['ROUTE']
  | typeof RECOVERY_MAP['ROBOT_RELEASING_LABWARE']['ROUTE']

type OriginalRouteKey = keyof RecoveryMap
type StepsForRoute<R extends RouteKey> = RecoveryMap[{
  [K in OriginalRouteKey]: RecoveryMap[K]['ROUTE'] extends R ? K : never
}[OriginalRouteKey]]['STEPS']
type StepKey<R extends RouteKey> = StepsForRoute<R>[keyof StepsForRoute<R>]
export type AllStepTypes = {
  [R in RouteKey]: StepKey<R>
}[RouteKey]

export type RouteStep = AllStepTypes | InvalidStep
export type StepOrder = {
  [K in RecoveryRoute]: RouteStep[]
}

/**
 * Route/Step Properties Types
 */
interface StepDoorConfig {
  allowDoorOpen: boolean
}
type RouteDoorConfig<R extends RouteKey> = {
  [Step in StepKey<R> & string]: StepDoorConfig
}
export type RecoveryRouteStepMetadata = {
  [R in RouteKey]: RouteDoorConfig<R>
}

/**
 * Style Types
 */
export type DesktopSizeType = 'desktop-small' | 'desktop-large'
