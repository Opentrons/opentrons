import * as React from 'react'
import { useLogger } from '../../logger'
import { LabwarePositionCheckComponent } from './LabwarePositionCheckComponent'
import { FatalErrorModal } from './FatalErrorModal'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => void
  runId: string
  maintenanceRunId: string
  shouldUseMetalProbe: boolean
  existingOffsets: LabwareOffset[]
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  protocolName: string
  caughtError?: Error
  setMaintenanceRunId: (id: string | null) => void
  isDeletingMaintenanceRun: boolean
}

// We explicitly wrap LabwarePositionCheckComponent in an ErrorBoundary because an error might occur while pulling in
// the component's dependencies (like useLabwarePositionCheck). If we wrapped the contents of LabwarePositionCheckComponent
// in an ErrorBoundary as part of its return value (render), an error could occur before this point, meaning the error boundary
// would never get invoked
export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element => {
  const logger = useLogger(__filename)
  return (
    <ErrorBoundary
      logger={logger}
      ErrorComponent={FatalErrorModal}
      onClose={props.onCloseClick}
    >
      <LabwarePositionCheckComponent {...props} />
    </ErrorBoundary>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  onClose: () => void
  logger: ReturnType<typeof useLogger>
  ErrorComponent: (props: {
    errorMessage: string
    onClose: () => void
  }) => JSX.Element
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
    if (error != null)
      return (
        <ErrorComponent
          errorMessage={error.message}
          onClose={this.props.onClose}
        />
      )
    // Normally, just render children
    return children
  }
}
