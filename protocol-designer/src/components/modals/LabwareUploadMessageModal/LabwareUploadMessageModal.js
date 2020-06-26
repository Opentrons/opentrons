// @flow
import assert from 'assert'
import cx from 'classnames'
import * as React from 'react'
import {
  AlertModal,
  OutlineButton,
  type ButtonProps,
} from '@opentrons/components'
import { i18n } from '../../../localization'
import modalStyles from '../modal.css'
import type { LabwareUploadMessage } from '../../../labware-defs'

const MessageBody = (props: {| message: LabwareUploadMessage |}) => {
  const { message } = props

  console.log({ message })

  if (
    message.messageType === 'EXACT_LABWARE_MATCH' ||
    message.messageType === 'INVALID_JSON_FILE' ||
    message.messageType === 'ONLY_TIPRACK' ||
    message.messageType === 'NOT_JSON' ||
    message.messageType === 'USES_STANDARD_NAMESPACE'
  ) {
    return (
      <>
        <p>
          {i18n.t(
            `modal.labware_upload_message.message.${message.messageType}`
          )}
        </p>
        {message.errorText ? <p>{message.errorText}</p> : null}
      </>
    )
  } else if (
    message.messageType === 'ASK_FOR_LABWARE_OVERWRITE' ||
    message.messageType === 'LABWARE_NAME_CONFLICT'
  ) {
    const { defsMatchingDisplayName, defsMatchingLoadName } = message
    const canOverwrite = message.messageType === 'ASK_FOR_LABWARE_OVERWRITE'
    return (
      <>
        <p>
          {i18n.t('modal.labware_upload_message.name_conflict.shares_name', {
            customOrStandard: canOverwrite ? 'custom' : 'Opentrons standard',
          })}
        </p>
        {canOverwrite && defsMatchingLoadName.length > 0 ? (
          <p>
            <strong>
              {i18n.t(
                'modal.labware_upload_message.name_conflict.shared_load_name'
              )}
              {defsMatchingLoadName
                .map(def => def?.parameters.loadName || '?')
                .join(', ')}
            </strong>
          </p>
        ) : null}
        {canOverwrite && defsMatchingDisplayName.length > 0 ? (
          <p>
            <strong>
              {i18n.t(
                'modal.labware_upload_message.name_conflict.shared_display_name'
              )}
              {defsMatchingDisplayName
                .map(def => def?.metadata.displayName || '?')
                .join(', ')}
            </strong>
          </p>
        ) : null}
        <p>{i18n.t('modal.labware_upload_message.name_conflict.re_export')}</p>
        {canOverwrite && (
          <p>
            {i18n.t('modal.labware_upload_message.name_conflict.overwrite')}
          </p>
        )}
        {canOverwrite && message.isOverwriteMismatched && (
          <p>
            <strong>
              {i18n.t('modal.labware_upload_message.name_conflict.warning')}
            </strong>{' '}
            {i18n.t('modal.labware_upload_message.name_conflict.mismatched')}
          </p>
        )}
      </>
    )
  }
  assert(false, `MessageBody got unhandled messageType: ${message.messageType}`)
  return null
}

type Props = {|
  message: ?LabwareUploadMessage,
  dismissModal: () => mixed,
  overwriteLabwareDef?: () => mixed,
|}

export const LabwareUploadMessageModal = (props: Props): React.Node => {
  const { message, dismissModal, overwriteLabwareDef } = props
  if (!message) return null

  let buttons: Array<ButtonProps> = [{ children: 'OK', onClick: dismissModal }]
  if (message.messageType === 'ASK_FOR_LABWARE_OVERWRITE') {
    buttons = [
      { children: 'CANCEL IMPORT', onClick: dismissModal },
      {
        children: 'OVERWRITE LABWARE',
        onClick: overwriteLabwareDef,
        className: modalStyles.long_button,
      },
    ]
  }

  return (
    <AlertModal
      heading={i18n.t(
        `modal.labware_upload_message.title.${message.messageType}`
      )}
      className={modalStyles.modal}
      alertOverlay
    >
      <MessageBody message={message} />
      {buttons.map((button, index) => (
        <OutlineButton
          {...button}
          key={index}
          className={cx(modalStyles.bottom_button, button.className)}
        />
      ))}
    </AlertModal>
  )
}
