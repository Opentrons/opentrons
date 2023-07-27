import * as React from 'react'
import { useSelector } from 'react-redux'

import { useEstopQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '../../redux/discovery'
import { EstopPressedModal } from './EstopPressedModal'
import { EstopMissingModal } from './EstopMissingModal'
import { PHYSICALLY_ENGAGED, LOGICALLY_ENGAGED, NOT_PRESENT } from './constants'

const ESTOP_REFETCH_INTERVAL_MS = 10000

interface ShowModalType {
  showModal: boolean
  modalType: 'pressed' | 'missing'
}

export function EstopTakeover(): JSX.Element {
  const { data: estopStatus } = useEstopQuery({
    refetchInterval: ESTOP_REFETCH_INTERVAL_MS,
  })
  const [showEstopModal, setShowEstopModal] = React.useState<ShowModalType>({
    showModal: false,
    modalType: 'pressed',
  })

  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? 'no name'

  const closeModal = (): void => {
    setShowEstopModal({ ...showEstopModal, showModal: false })
  }

  const targetEstopModal = (): JSX.Element => {
    return (
      <>
        {showEstopModal.modalType === 'pressed' ? (
          <EstopPressedModal
            isEngaged={estopStatus?.data.status === PHYSICALLY_ENGAGED}
            closeModal={closeModal}
          />
        ) : (
          <EstopMissingModal robotName={robotName} closeModal={closeModal} />
        )}
      </>
    )
  }

  React.useEffect(() => {
    if (
      estopStatus?.data.status === PHYSICALLY_ENGAGED ||
      estopStatus?.data.status === LOGICALLY_ENGAGED
    ) {
      setShowEstopModal({ showModal: true, modalType: 'pressed' })
    } else if (estopStatus?.data.status === NOT_PRESENT) {
      setShowEstopModal({ showModal: true, modalType: 'missing' })
    }
  }, [estopStatus])

  React.useEffect(() => {
    if (
      showEstopModal.showModal &&
      showEstopModal.modalType === 'missing' &&
      estopStatus?.data.status !== NOT_PRESENT
    ) {
      setShowEstopModal({ showModal: false, modalType: 'pressed' })
    }
  }, [estopStatus, showEstopModal])

  return <>{showEstopModal.showModal ? targetEstopModal() : null}</>
}
