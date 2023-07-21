import * as React from 'react'
import {
  useInstrumentsQuery,
  useCurrentMaintenanceRun,
} from '@opentrons/react-api-client'
import { UpdateNeededModal } from './UpdateNeededModal'

const INSTRUMENT_POLL_INTERVAL = 5000

export function FirmwareUpdateTakeover(): JSX.Element {
  const [
    showUpdateNeededModal,
    setShowUpdateNeededModal,
  ] = React.useState<boolean>(false)
  const instrumentsData = useInstrumentsQuery({
    refetchInterval: INSTRUMENT_POLL_INTERVAL,
  }).data?.data
  const { data: maintenanceRunData } = useCurrentMaintenanceRun()
  const subsystemUpdateInstrument = instrumentsData?.find(
    instrument => instrument.ok === false
  )

  React.useEffect(() => {
    if (subsystemUpdateInstrument != null && maintenanceRunData == null) {
      setShowUpdateNeededModal(true)
    }
  }, [subsystemUpdateInstrument])

  return (
    <>
      {subsystemUpdateInstrument != null && showUpdateNeededModal ? (
        <UpdateNeededModal
          subsystem={subsystemUpdateInstrument.subsystem}
          setShowUpdateModal={setShowUpdateNeededModal}
        />
      ) : null}
    </>
  )
}
