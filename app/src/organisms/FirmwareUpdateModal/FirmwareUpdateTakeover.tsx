import * as React from 'react'

import {
  useInstrumentsQuery,
  useCurrentAllSubsystemUpdatesQuery,
  useSubsystemUpdateQuery,
} from '@opentrons/react-api-client'
import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs/useNotifyCurrentMaintenanceRun'
import { Portal } from '../../App/portal'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'
import { UpdateInProgressModal } from './UpdateInProgressModal'
import { UpdateNeededModal } from './UpdateNeededModal'
import type { Subsystem } from '@opentrons/api-client'

const POLL_INTERVAL_MS = 5000

export function FirmwareUpdateTakeover(): JSX.Element {
  const [
    showUpdateNeededModal,
    setShowUpdateNeededModal,
  ] = React.useState<boolean>(false)
  const [
    initiatedSubsystemUpdate,
    setInitiatedSubsystemUpdate,
  ] = React.useState<Subsystem | null>(null)

  const instrumentsData = useInstrumentsQuery({
    refetchInterval: POLL_INTERVAL_MS,
  }).data?.data
  const subsystemUpdateInstrument = instrumentsData?.find(
    instrument => instrument.ok === false
  )

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: POLL_INTERVAL_MS,
  })
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  const {
    data: currentSubsystemsUpdatesData,
  } = useCurrentAllSubsystemUpdatesQuery({
    refetchInterval: POLL_INTERVAL_MS,
  })
  const externalSubsystemUpdate = currentSubsystemsUpdatesData?.data.find(
    update =>
      (update.updateStatus === 'queued' ||
        update.updateStatus === 'updating') &&
      update.subsystem !== initiatedSubsystemUpdate
  )
  const { data: externalsubsystemUpdateData } = useSubsystemUpdateQuery(
    externalSubsystemUpdate?.id ?? null
  )

  React.useEffect(() => {
    if (
      subsystemUpdateInstrument != null &&
      maintenanceRunData == null &&
      !isUnboxingFlowOngoing &&
      externalSubsystemUpdate == null
    ) {
      setShowUpdateNeededModal(true)
    }
  }, [
    subsystemUpdateInstrument,
    maintenanceRunData,
    isUnboxingFlowOngoing,
    externalSubsystemUpdate,
  ])
  const memoizedSubsystem = React.useMemo(
    () => subsystemUpdateInstrument?.subsystem,
    []
  )

  return (
    <>
      {memoizedSubsystem != null && showUpdateNeededModal ? (
        <UpdateNeededModal
          subsystem={memoizedSubsystem}
          setShowUpdateModal={setShowUpdateNeededModal}
          setInitiatedSubsystemUpdate={setInitiatedSubsystemUpdate}
        />
      ) : null}
      {externalsubsystemUpdateData != null && maintenanceRunData == null ? (
        <Portal level="top">
          <UpdateInProgressModal
            percentComplete={externalsubsystemUpdateData.data.updateProgress}
            subsystem={externalsubsystemUpdateData.data.subsystem}
          />
        </Portal>
      ) : null}
    </>
  )
}
