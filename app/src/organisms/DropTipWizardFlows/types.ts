import type { DT_ROUTES } from './constants'
import type { DropTipErrorComponents } from './hooks'
import type { DropTipWizardProps } from './DropTipWizard'

export type DropTipFlowsRoute = typeof DT_ROUTES[keyof typeof DT_ROUTES]
export type DropTipFlowsStep = DropTipFlowsRoute[number]
export interface ErrorDetails {
  message: string
  header?: string
  type?: string
}

export type IssuedCommandsType = 'setup' | 'fixit'
export type DropTipModalStyle = 'simple' | 'intervention'

interface CopyOverrides {
  tipDropCompleteBtnCopy: string
  beforeBeginningTopText: string
}

interface ErrorOverrides {
  blowoutFailed: () => void
  tipDropFailed: () => void
  generalFailure: () => void
}

interface ButtonOverrides {
  goBackBeforeBeginning: () => void
  tipDropComplete: (() => void) | null
}

export interface DropTipWizardRouteOverride {
  route: DropTipFlowsRoute
  step: DropTipFlowsStep | null
}

export interface FixitCommandTypeUtils {
  runId: string
  failedCommandId: string
  pipetteId: string | null
  copyOverrides: CopyOverrides
  errorOverrides: ErrorOverrides
  buttonOverrides: ButtonOverrides
  /* Report to an external flow (ex, Error Recovery) the current step of drop tip wizard. */
  reportMap: (dropTipMap: DropTipWizardRouteOverride | null) => void
  /* If supplied, begin drop tip flows on the specified route & step. If no step is supplied, begin at the start of the route. */
  routeOverride?: DropTipWizardRouteOverride
}

export type DropTipWizardContainerProps = DropTipWizardProps & {
  isOnDevice: boolean
  toggleExitInitiated: () => void
  isExitInitiated: boolean
  isFinalWizardStep: boolean
  showConfirmExit: boolean
  confirmExit: () => void
  cancelExit: () => void
  errorComponents: DropTipErrorComponents
  proceedWithConditionalClose: () => void
  goBackRunValid: () => void
}

/**
 * Drop-tip/Blowout location types
 */
export type ValidDropTipBlowoutLocation =
  | 'trash-bin'
  | 'fixed-trash'
  | 'waste-chute'
  | 'labware'
  | 'deck'
