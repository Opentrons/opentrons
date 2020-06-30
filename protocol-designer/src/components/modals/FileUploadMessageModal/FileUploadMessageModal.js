// @flow
import * as React from 'react'
import { AlertModal, OutlineButton } from '@opentrons/components'
import { i18n } from '../../../localization'
import modalStyles from '../modal.css'
import type { FileUploadMessage } from '../../../load-file'
import { getModalContents } from './modalContents'

type Props = {
  message: ?FileUploadMessage,
  cancelProtocolMigration: (SyntheticEvent<*>) => mixed,
  dismissModal: (SyntheticEvent<*>) => mixed,
}

export function FileUploadMessageModal(props: Props): React.Node {
  const { message, cancelProtocolMigration, dismissModal } = props

  if (!message) return null

  const { title, body, okButtonText } = getModalContents(message)
  const buttons = [
    {
      children: okButtonText || 'ok',
      onClick: dismissModal,
      className: modalStyles.ok_button,
    },
    {
      children: i18n.t('button.cancel'),
      onClick: cancelProtocolMigration,
    },
  ]
  return (
    <AlertModal
      heading={title}
      className={modalStyles.modal}
      contentsClassName={modalStyles.scrollable_modal_contents}
      alertOverlay
    >
      <div className={modalStyles.scrollable_modal_wrapper}>
        <div className={modalStyles.scrollable_modal_scroll}>{body}</div>
        <div>
          {buttons.map((button, index) => (
            <OutlineButton
              {...button}
              key={index}
              className={modalStyles.bottom_button}
            />
          ))}
        </div>
      </div>
    </AlertModal>
  )
}
