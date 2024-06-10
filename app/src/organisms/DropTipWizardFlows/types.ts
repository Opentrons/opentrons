import type { DT_ROUTES } from './constants'
import type { DropTipErrorComponents } from './hooks'
import type { DropTipWizardProps } from './DropTipWizard'
import type { ERUtilsResults } from '../ErrorRecoveryFlows/hooks'

export type DropTipFlowsRoute = typeof DT_ROUTES[keyof typeof DT_ROUTES]
export type DropTipFlowsStep = DropTipFlowsRoute[number]

export interface ErrorDetails {
  message: string
  header?: string
  type?: string
}

export type IssuedCommandsType = 'setup' | 'fixit'

interface CopyOverrides {
  tipDropCompleteBtnCopy: string
  beforeBeginningTopText: string
}

export interface FixitCommandTypeUtils {
  runId: string
  failedCommandId: string
  trackCurrentMap: ERUtilsResults['trackExternalMap']
  copyOverrides: CopyOverrides
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
