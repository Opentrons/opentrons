import * as React from 'react'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { UpdateNeededModal } from './UpdateNeededModal'

export function FirmwareUpdateTakeover(): JSX.Element {
  const [
    showUpdateNeededModal,
    setShowUpdateNeededModal,
  ] = React.useState<boolean>(false)
  const instrumentsData = useInstrumentsQuery({
    refetchInterval: 5000,
  }).data?.data
  const subsystemUpdateInstrument = instrumentsData?.find(
    instrument => instrument.ok === false
  )

  React.useEffect(() => {
    if (subsystemUpdateInstrument != null) {
      setShowUpdateNeededModal(true)
    }
  }, [subsystemUpdateInstrument])

  return (
    <>
      {subsystemUpdateInstrument != null && showUpdateNeededModal && (
        <UpdateNeededModal
          subsystem={subsystemUpdateInstrument.subsystem}
          setShowUpdateModal={setShowUpdateNeededModal}
        />
      )}
    </>
  )
}
