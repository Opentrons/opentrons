import React from 'react'
import modalStyles from '../../modals/modal.css'
import { Portal } from '../../portals/MainPageModalPortal'
import { AlertModal } from '@opentrons/components'

interface ExportJsonAlertProps {
  warning: any
  showExportWarningModal: boolean
  blockingExportHint: JSX.Element | null
  setShowBlockingHint: React.Dispatch<React.SetStateAction<boolean>>
  setShowExportWarningModal: React.Dispatch<React.SetStateAction<boolean>>
}
export const ExportJsonAlert = (props: ExportJsonAlertProps): JSX.Element => {
  const {
    warning,
    blockingExportHint,
    setShowBlockingHint,
    showExportWarningModal,
    setShowExportWarningModal,
  } = props
  const cancelModal = (): void => setShowExportWarningModal(false)

  return (
    <>
      {blockingExportHint}
      {showExportWarningModal && (
        <Portal>
          <AlertModal
            alertOverlay
            className={modalStyles.modal}
            heading={warning && warning.heading}
            onCloseClick={cancelModal}
            buttons={[
              {
                children: 'CANCEL',
                onClick: cancelModal,
              },
              {
                children: 'CONTINUE WITH EXPORT',
                className: modalStyles.long_button,
                onClick: () => {
                  setShowExportWarningModal(false)
                  setShowBlockingHint(true)
                },
              },
            ]}
          >
            {warning && warning.content}
          </AlertModal>
        </Portal>
      )}
    </>
  )
}
