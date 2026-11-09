export interface GetWizardHeaderExitArgs {
  isError: boolean
  isBusy: boolean
  onExitError: () => void
  onExitIdle: () => void
}

export interface WizardHeaderExitProps {
  onExit?: () => void
  exitDisabled: boolean
}

export function getWizardHeaderExit(
  args: GetWizardHeaderExitArgs
): WizardHeaderExitProps {
  const { isError, isBusy, onExitError, onExitIdle } = args
  const exitKind = isError ? 'error' : isBusy ? 'busy' : 'idle'

  switch (exitKind) {
    case 'error':
      return { onExit: onExitError, exitDisabled: false }
    case 'busy':
      return { onExit: undefined, exitDisabled: true }
    case 'idle':
      return { onExit: onExitIdle, exitDisabled: false }
  }
}
