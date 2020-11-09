// @flow
import { i18n } from '../../../localization'
import * as React from 'react'
import cx from 'classnames'
import { AlertModal, OutlineButton } from '@opentrons/components'
import modalStyles from '../modal.css'
import { getModalContents } from './modalContents'
import type { FileUploadMessage } from '../../../load-file'

type Props = {
  message: ?FileUploadMessage,
  cancelProtocolMigration: (SyntheticEvent<*>) => mixed,
  dismissModal: (SyntheticEvent<*>) => mixed,
}

export function FileUploadMessageModal(props: Props): React.Node {
  const { message, cancelProtocolMigration, dismissModal } = props

  if (!message) return null

  const { title, body, okButtonText } = getModalContents(message)
  let buttons = [
    {
      children: i18n.t('button.cancel'),
      onClick: cancelProtocolMigration,
      className: modalStyles.bottom_button,
    },
    {
      children: okButtonText || 'ok',
      onClick: dismissModal,
      className: modalStyles.button_medium,
    },
  ]
  if (title === 'Incorrect file type' || title === 'Invalid JSON file') {
    buttons = [
      {
        children: okButtonText || 'ok',
        onClick: dismissModal,
        className: modalStyles.button_medium,
      },
    ]
  }

  return (
    <AlertModal
      heading={title}
      className={modalStyles.modal}
      contentsClassName={modalStyles.scrollable_modal_contents}
      alertOverlay
    >
      <div className={modalStyles.scrollable_modal_wrapper}>
        <div className={modalStyles.scrollable_modal_scroll}>{body}</div>
        <div className={modalStyles.button_row}>
          {buttons.map((button, index) => (
            <OutlineButton
              {...button}
              key={index}
              className={cx(
                modalStyles.bottom_button,
                modalStyles.button_medium
              )}
            />
          ))}
        </div>
      </div>
    </AlertModal>
  )
}
