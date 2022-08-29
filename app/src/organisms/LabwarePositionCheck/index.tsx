import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal, Box, SPACING_2, Text } from '@opentrons/components'
import { Portal } from '../../App/portal'
import { useLogger } from '../../logger'
import { useFeatureFlag } from '../../redux/config'
import { LabwarePositionCheckComponent } from './LabwarePositionCheckComponent'
import { DeprecatedLabwarePositionCheckComponent } from './DeprecatedComponents/DeprecatedLabwarePositionCheckComponent'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  caughtError?: Error
}

// We explicitly wrap LabwarePositionCheckComponent in an ErrorBoundary because an error might occur while pulling in
// the component's dependencies (like useLabwarePositionCheck). If we wrapped the contents of LabwarePositionCheckComponent
// in an ErrorBoundary as part of its return value (render), an error could occur before this point, meaning the error boundary
// would never get invoked
export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element => {
  const logger = useLogger(__filename)
  const manualDeckStateModificationEnabled = useFeatureFlag(
    'enableManualDeckStateModification'
  )

  return (
    <ErrorBoundary logger={logger} ErrorComponent={CrashingErrorModal}>
      {manualDeckStateModificationEnabled ? (
        <LabwarePositionCheckComponent {...props} />
      ) : (
        <DeprecatedLabwarePositionCheckComponent {...props} />
      )}
    </ErrorBoundary>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  logger: ReturnType<typeof useLogger>
  ErrorComponent: (props: { errorMessage: string }) => JSX.Element
}
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.logger.error(`LPC error message: ${error.message}`)
    this.props.logger.error(
      `LPC error component stack: ${errorInfo.componentStack}`
    )
    this.setState({
      error,
    })
  }

  render(): ErrorBoundaryProps['children'] | JSX.Element {
    const { ErrorComponent, children } = this.props
    const { error } = this.state
    if (error != null) return <ErrorComponent errorMessage={error.message} />
    // Normally, just render children
    return children
  }
}

interface CrashingErrorModalProps {
  errorMessage: string
}
function CrashingErrorModal(props: CrashingErrorModalProps): JSX.Element {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  return (
    <Portal level="top">
      <AlertModal
        heading={t('error_modal_header')}
        iconName={null}
        alertOverlay
      >
        <Box>
          <Text>{t('error_modal_problem_in_app')}</Text>
          <Text marginTop={SPACING_2}>
            `${t('shared:error')}: ${props.errorMessage}`
          </Text>
        </Box>
      </AlertModal>
    </Portal>
  )
}
