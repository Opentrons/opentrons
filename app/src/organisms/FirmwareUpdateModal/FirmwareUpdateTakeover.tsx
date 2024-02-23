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
  const [instrumentsToUpdate, setInstrumentsToUpdate] = React.useState<
    InstrumentData[]
  >([])
  instrumentsData?.forEach(instrument => {
    if (
      !instrument.ok &&
      instrumentsToUpdate.find(
        (i): i is InstrumentData => i.subsystem === instrument.subsystem
      ) == null
    ) {
      setInstrumentsToUpdate([...instrumentsToUpdate, instrument])
    }
  })
  const [indexToUpdate, setIndexToUpdate] = React.useState(0)

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
    // in case instruments are updated elsewhere in the app, clear update needed list
    // when all instruments are ok but array has elements
    if (
      instrumentsData?.find(instrument => !instrument.ok) == null &&
      !showUpdateNeededModal &&
      instrumentsToUpdate.length > 0
    ) {
      setInstrumentsToUpdate([])
      setIndexToUpdate(0)
    } else if (
      instrumentsToUpdate.length > indexToUpdate &&
      instrumentsToUpdate[indexToUpdate]?.subsystem != null &&
      maintenanceRunData == null &&
      !isUnboxingFlowOngoing &&
      externalSubsystemUpdate == null
    ) {
      setShowUpdateNeededModal(true)
    }
    // close modal if update is no longer needed
    else if (
      instrumentsData?.find(instrument => !instrument.ok) == null &&
      initiatedSubsystemUpdate == null &&
      showUpdateNeededModal
    ) {
      setShowUpdateNeededModal(false)
    }
  }, [
    externalSubsystemUpdate,
    indexToUpdate,
    instrumentsToUpdate,
    initiatedSubsystemUpdate,
    instrumentsData,
    isUnboxingFlowOngoing,
    maintenanceRunData,
    showUpdateNeededModal,
  ])

  return (
    <>
      {instrumentsToUpdate.length > indexToUpdate &&
      instrumentsToUpdate[indexToUpdate]?.subsystem != null &&
      showUpdateNeededModal ? (
        <UpdateNeededModal
          subsystem={instrumentsToUpdate[indexToUpdate]?.subsystem}
          onClose={() => {
            // if no more instruments need updating, close the modal and clear data
            // otherwise start over with next instrument
            if (instrumentsToUpdate.length <= indexToUpdate + 1) {
              setShowUpdateNeededModal(false)
              setInstrumentsToUpdate([])
              setIndexToUpdate(0)
            } else {
              setIndexToUpdate(prevIndexToUpdate => prevIndexToUpdate + 1)
            }
          }}
          shouldExit={instrumentsToUpdate.length <= indexToUpdate + 1}
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
