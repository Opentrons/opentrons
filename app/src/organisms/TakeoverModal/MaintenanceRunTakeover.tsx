import * as React from 'react'
import {
  useCurrentMaintenanceRun,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { TakeoverModal } from './TakeoverModal'
import { TakeoverModalContext } from './TakeoverModalContext'

interface MaintenanceRunTakeoverProps {
  children: React.ReactNode
}
export function MaintenanceRunTakeover(
  props: MaintenanceRunTakeoverProps
): JSX.Element {
  const [
    isODDMaintanenceInProgress,
    setIsODDMaintanenceInProgress,
  ] = React.useState<boolean>(false)
  const maintenanceRunId = useCurrentMaintenanceRun({
    refetchInterval: 5000,
  }).data?.data.id

  const isMaintanenceRunCurrent = maintenanceRunId != null

  const [
    showConfirmTerminateModal,
    setShowConfirmTerminateModal,
  ] = React.useState<boolean>(false)

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()

  const handleCloseAndTerminate = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId, {
        onSuccess: () => {
          setShowConfirmTerminateModal(false)
        },
      })
    }
  }

  return (
    <TakeoverModalContext.Provider
      value={{
        setODDMaintenanceFlowInProgress: () =>
          setIsODDMaintanenceInProgress(true),
      }}
    >
      {!isODDMaintanenceInProgress && isMaintanenceRunCurrent && (
        <TakeoverModal
          confirmTerminate={handleCloseAndTerminate}
          showConfirmTerminateModal={showConfirmTerminateModal}
          setShowConfirmTerminateModal={setShowConfirmTerminateModal}
        />
      )}
      {props.children}
    </TakeoverModalContext.Provider>
  )
}
