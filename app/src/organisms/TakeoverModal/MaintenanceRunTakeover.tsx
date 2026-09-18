import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { MaintenanceRunStatusProvider } from './MaintenanceRunStatusProvider'
import { TakeoverModal } from './TakeoverModal'
import { useMaintenanceRunTakeover } from './useMaintenanceRunTakeover'

import type { ReactNode } from 'react'

interface MaintenanceRunTakeoverProps {
  children: ReactNode
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
  children: ReactNode
}

export function MaintenanceRunTakeoverModal(
  props: MaintenanceRunTakeoverModalProps
): JSX.Element {
  const { i18n, t } = useTranslation(['shared', 'branded'])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showConfirmTerminateModal, setShowConfirmTerminateModal] =
    useState<boolean>(false)

  const { oddRunId, currentRunId } = useMaintenanceRunTakeover().getRunIds()
  const isMaintenanceRunCurrent = currentRunId != null

  const desktopMaintenanceRunInProgress =
    isMaintenanceRunCurrent && oddRunId !== currentRunId

  // TODO(jj): This needs to access the docstate and actions for the current maintenance run.
  const docState = useDocumentationState()

  const { deleteMaintenanceRun, reset } = useDeleteMaintenanceRunMutation(
    docState,
    ['end_calibration'],
    {
      onError: () => {
        setIsLoading(false)
      },
    }
  )

  const handleCloseAndTerminate = (): void => {
    if (currentRunId != null) {
      setIsLoading(true)
      deleteMaintenanceRun(currentRunId)
    }
  }

  useEffect(
    () => {
      if (currentRunId == null) {
        setIsLoading(false)
        setShowConfirmTerminateModal(false)
        reset()
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRunId]
  )

  return (
    <>
      {desktopMaintenanceRunInProgress && (
        <TakeoverModal
          title={i18n.format(t('robot_is_busy'), 'capitalize')}
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
