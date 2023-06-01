import * as React from 'react'
import {
  useCurrentMaintenanceRun,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { TakeoverModal } from './TakeoverModal'
import { TakeoverModalContext } from './TakeoverModalContext'

interface TakeoverModalProviderProps {
  children: React.ReactNode
}
export function TakeoverModalProvider(
  props: TakeoverModalProviderProps
): JSX.Element {
  const [
    isDesktopAppMaintanenceInProgress,
    setIsDesktopAppMaintenanceInProgress,
  ] = React.useState<boolean>(false)
  const maintenanceRunIdFromHook = useCurrentMaintenanceRun({
    refetchInterval: 5000,
  }).data?.data.id

  const isMaintanenceRunCurrent = maintenanceRunIdFromHook != null
  const [maintenanceRunId, setMaintenanceRunId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (maintenanceRunIdFromHook != null) {
      setMaintenanceRunId(maintenanceRunIdFromHook)
    } else {
      setMaintenanceRunId(null)
    }
  }, [maintenanceRunIdFromHook])

  const [isConfirmTerminate, setConfirmTerminate] = React.useState<boolean>(
    false
  )

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation()

  const handleCloseAndTerminate = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId, {
        onSuccess: () => {
          setMaintenanceRunId(null)
          setIsDesktopAppMaintenanceInProgress(true)
          setConfirmTerminate(false)
        },
      })
    }
  }

  return (
    <TakeoverModalContext.Provider
      value={{
        setMaintenanceInProgress: () =>
          setIsDesktopAppMaintenanceInProgress(true),
      }}
    >
      {!isDesktopAppMaintanenceInProgress && isMaintanenceRunCurrent && (
        <TakeoverModal
          confirmTerminate={() => handleCloseAndTerminate()}
          isConfirmTerminate={isConfirmTerminate}
          setConfirmTerminate={setConfirmTerminate}
        />
      )}
      {props.children}
    </TakeoverModalContext.Provider>
  )
}
