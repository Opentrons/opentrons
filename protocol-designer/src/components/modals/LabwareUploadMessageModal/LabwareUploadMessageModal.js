// @flow
import * as React from 'react'
import { AlertModal, OutlineButton } from '@opentrons/components'
import modalStyles from '../modal.css'
import type { LabwareUploadMessage } from '../../../labware-defs'

type Props = {|
  message: ?LabwareUploadMessage,
  dismissModal: () => mixed,
  overwriteLabware?: () => mixed,
|}

const LabwareUploadMessageModal = (props: Props) => {
  const { message, dismissModal, overwriteLabware } = props
  if (!message) return null

  let buttons = [{ children: 'OK', onClick: dismissModal }]
  if (message.messageType === 'ASK_FOR_LABWARE_OVERWRITE') {
    buttons = [...buttons, { children: 'OVERWRITE', onClick: overwriteLabware }]
  }
  return (
    <AlertModal
      heading="Labware Upload Error"
      className={modalStyles.modal}
      alertOverlay
    >
      {message.message === undefined ? null : <div>{message.message}</div>}
      {buttons.map((button, index) => (
        <OutlineButton
          {...button}
          key={index}
          className={modalStyles.bottom_button}
        />
      ))}
    </AlertModal>
  )
}

export default LabwareUploadMessageModal
