import * as React from 'react'
import {
  useCurrentMaintenanceRun,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { TakeoverModal } from './TakeoverModal'
import { TakeoverModalContext } from './TakeoverModalContext'

const MAINTENANCE_RUN_POLL_MS = 10000
interface MaintenanceRunTakeoverProps {
  children: React.ReactNode
}
export function MaintenanceRunTakeover(
  props: MaintenanceRunTakeoverProps
): JSX.Element {
  const [
    isODDMaintenanceInProgress,
    setIsODDMaintenanceInProgress,
  ] = React.useState<boolean>(false)
  const maintenanceRunId = useCurrentMaintenanceRun({
    refetchInterval: MAINTENANCE_RUN_POLL_MS,
  }).data?.data.id
  const isMaintenanceRunCurrent = maintenanceRunId != null

  const [
    showConfirmTerminateModal,
    setShowConfirmTerminateModal,
  ] = React.useState<boolean>(false)

  const {
    deleteMaintenanceRun,
    status,
    reset,
  } = useDeleteMaintenanceRunMutation()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const handleCloseAndTerminate = (): void => {
    if (maintenanceRunId != null) {
      setIsLoading(true)
      deleteMaintenanceRun(maintenanceRunId)
    }
  }

  React.useEffect(() => {
    if (maintenanceRunId == null && status === 'success') {
      setIsLoading(false)
      setShowConfirmTerminateModal(false)
      reset()
    }
  }, [maintenanceRunId, status])

  return (
    <TakeoverModalContext.Provider
      value={{
        setODDMaintenanceFlowInProgress: () =>
          setIsODDMaintenanceInProgress(true),
      }}
    >
      {!isODDMaintenanceInProgress && isMaintenanceRunCurrent && (
        <TakeoverModal
          confirmTerminate={handleCloseAndTerminate}
          showConfirmTerminateModal={showConfirmTerminateModal}
          setShowConfirmTerminateModal={setShowConfirmTerminateModal}
          terminateInProgress={isLoading}
        />
      )}
      {props.children}
    </TakeoverModalContext.Provider>
  )
}
