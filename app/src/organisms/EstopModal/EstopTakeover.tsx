import * as React from 'react'
import { useSelector } from 'react-redux'

import { useEstopQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '../../redux/discovery'
import { EstopPressedModal } from './EstopPressedModal'
import { EstopMissingModal } from './EstopMissingModal'

interface EstopTakeoverProps {
  children: React.ReactNode
}

const ESTOP_REFETCH_INTERVAL_MS = 10000

interface ShowModal {
  showModal: boolean
  modalType: 'pressed' | 'missing'
}

export function EstopTakeover(): JSX.Element {
  const [showEstopModal, setShowEstopModal] = React.useState<ShowModal>({
    showModal: false,
    modalType: 'pressed',
  })
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: ESTOP_REFETCH_INTERVAL_MS,
  })

  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? 'no name'

  const targetEstopModal = (): JSX.Element => {
    return (
      <>
        {showEstopModal.modalType === 'pressed' ? (
          <EstopPressedModal
            isEngaged={estopStatus?.data.status === 'physicallyEngaged'}
          />
        ) : (
          <EstopMissingModal robotName={robotName} />
        )}
      </>
    )
  }

  React.useEffect(() => {
    if (
      estopStatus?.data.status === 'physicallyEngaged' ||
      estopStatus?.data.status === 'logicallyEngaged'
    ) {
      setShowEstopModal({ showModal: true, modalType: 'pressed' })
    } else if (estopStatus?.data.status === 'notPresent') {
      setShowEstopModal({ showModal: true, modalType: 'missing' })
    }
  }, [estopStatus])

  return <>{showEstopModal.showModal ? targetEstopModal() : null}</>
}
