import * as React from 'react'

import {
  useInstrumentsQuery,
  useCurrentMaintenanceRun,
  useCurrentAllSubsystemUpdatesQuery,
  useSubsystemUpdateQuery,
} from '@opentrons/react-api-client'

import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'
import { UpdateInProgressModal } from './UpdateInProgressModal'

import { UpdateNeededModal } from './UpdateNeededModal'
import type { Subsystem } from '@opentrons/api-client'
const POLL_INTERVAL_5000_MS = 5000

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
    refetchInterval: POLL_INTERVAL_5000_MS,
  }).data?.data
  const subsystemUpdateInstrument = instrumentsData?.find(
    instrument => instrument.ok === false
  )

  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
    refetchInterval: POLL_INTERVAL_5000_MS,
  })
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

  const {
    data: currentSubsystemsUpdatesData,
  } = useCurrentAllSubsystemUpdatesQuery({
    refetchInterval: POLL_INTERVAL_5000_MS,
  })
  const externalSubsystemUpdateExists =
    currentSubsystemsUpdatesData?.data.some(
      update =>
        (update.updateStatus === 'queued' ||
          update.updateStatus === 'updating') &&
        update.subsystem !== initiatedSubsystemUpdate
    ) ?? false
  const externalSubsystemUpdate = currentSubsystemsUpdatesData?.data.find(
    update =>
      update.updateStatus === 'updating' &&
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
      !externalSubsystemUpdateExists
    ) {
      setShowUpdateNeededModal(true)
    }
  }, [
    subsystemUpdateInstrument,
    maintenanceRunData,
    isUnboxingFlowOngoing,
    externalSubsystemUpdateExists,
  ])

  return (
    <>
      {subsystemUpdateInstrument != null && showUpdateNeededModal ? (
        <UpdateNeededModal
          subsystem={subsystemUpdateInstrument.subsystem}
          setShowUpdateModal={setShowUpdateNeededModal}
          setInitiatedSubsystemUpdate={setInitiatedSubsystemUpdate}
        />
      ) : null}
      {externalSubsystemUpdate != null ? (
        <UpdateInProgressModal
          percentComplete={
            externalsubsystemUpdateData?.data.updateProgress ?? 0
          }
        />
      ) : null}
    </>
  )
}
