import * as React from 'react'

import {
  useInstrumentsQuery,
  useCurrentMaintenanceRun,
  useCurrentAllSubsystemUpdatesQuery,
  useSubsystemUpdateQuery,
} from '@opentrons/react-api-client'
import { Portal } from '../../App/portal'
import { useIsUnboxingFlowOngoing } from '../RobotSettingsDashboard/NetworkSettings/hooks'
import { UpdateInProgressModal } from './UpdateInProgressModal'
import { UpdateNeededModal } from './UpdateNeededModal'
import type { Subsystem, InstrumentData } from '@opentrons/api-client'

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

  const instrumentsToUpdate = [] as InstrumentData[]
  instrumentsData?.forEach(instrument => {
    if (
      !instrument.ok &&
      instrumentsToUpdate.find(
        (i): i is InstrumentData => i.subsystem === instrument.subsystem
      ) == null
    ) {
      instrumentsToUpdate.push(instrument)
    }
  })
  const [indexToUpdate, setIndexToUpdate] = React.useState(0)
  const subsystemToUpdate =
    instrumentsToUpdate.length > indexToUpdate
      ? instrumentsToUpdate[indexToUpdate]?.subsystem
      : null

  const { data: maintenanceRunData } = useCurrentMaintenanceRun({
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
      subsystemToUpdate != null &&
      maintenanceRunData == null &&
      !isUnboxingFlowOngoing &&
      externalSubsystemUpdate == null
    ) {
      setShowUpdateNeededModal(true)
    }
  }, [
    subsystemToUpdate,
    maintenanceRunData,
    isUnboxingFlowOngoing,
    externalSubsystemUpdate,
  ])

  return (
    <>
      {subsystemToUpdate != null && showUpdateNeededModal ? (
        <UpdateNeededModal
          subsystem={subsystemToUpdate}
          onClose={() => {
            // if no more instruments need updating, close the modal
            // otherwise start over with next instrument
            if (instrumentsToUpdate.length <= indexToUpdate) {
              setShowUpdateNeededModal(false)
            } else {
              setIndexToUpdate(prevIndexToUpdate => prevIndexToUpdate + 1)
            }
          }}
          shouldExit={instrumentsToUpdate.length <= indexToUpdate}
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
