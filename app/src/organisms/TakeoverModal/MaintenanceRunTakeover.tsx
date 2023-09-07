import * as React from 'react'
import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'
import { TakeoverModal } from './TakeoverModal'
import { MaintenanceRunStatusProvider } from './MaintenanceRunStatusProvider'
import { useMaintenanceRunTakeover } from './useMaintenanceRunTakeover'

interface MaintenanceRunTakeoverProps {
  children: React.ReactNode
}

export function MaintenanceRunTakeover({
  children,
}: MaintenanceRunTakeoverProps): JSX.Element {
  return (
    <MaintenanceRunStatusProvider>
      <MaintenanceRunTakeoverModal>{children}</MaintenanceRunTakeoverModal>
    </MaintenanceRunStatusProvider>
  )
}

interface MaintenanceRunTakeoverModalProps {
  children: React.ReactNode
}

export function MaintenanceRunTakeoverModal(
  props: MaintenanceRunTakeoverModalProps
): JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [
    showConfirmTerminateModal,
    setShowConfirmTerminateModal,
  ] = React.useState<boolean>(false)

  const { oddRunId, currentRunId } = useMaintenanceRunTakeover().getRunIds()
  const isMaintenanceRunCurrent = currentRunId != null

  const desktopMaintenanceRunInProgress =
    isMaintenanceRunCurrent && oddRunId !== currentRunId

  const { deleteMaintenanceRun, reset } = useDeleteMaintenanceRunMutation()

  const handleCloseAndTerminate = (): void => {
    if (currentRunId != null) {
      setIsLoading(true)
      deleteMaintenanceRun(currentRunId)
    }
  }

  React.useEffect(() => {
    if (currentRunId == null) {
      setIsLoading(false)
      setShowConfirmTerminateModal(false)
      reset()
    }
  }, [currentRunId])

  return (
    <>
      {desktopMaintenanceRunInProgress && (
        <TakeoverModal
          confirmTerminate={handleCloseAndTerminate}
          showConfirmTerminateModal={showConfirmTerminateModal}
          setShowConfirmTerminateModal={setShowConfirmTerminateModal}
          terminateInProgress={isLoading}
        />
      )}
      {props.children}
    </>
  )
}
