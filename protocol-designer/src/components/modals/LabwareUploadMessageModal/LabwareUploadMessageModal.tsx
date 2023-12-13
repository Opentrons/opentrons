import assert from 'assert'
import cx from 'classnames'
import * as React from 'react'
import { AlertModal, OutlineButton, ButtonProps } from '@opentrons/components'
import { i18n } from '../../../localization'
import modalStyles from '../modal.module.css'
import { LabwareUploadMessage } from '../../../labware-defs'

const MessageBody = (props: {
  message: LabwareUploadMessage
}): JSX.Element | null => {
  const { message } = props

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
        {/* @ts-expect-error (ce, 2021-06-23) errorText does not exist on all type posibilities at this point */}
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
        {/* @ts-expect-error (ce, 2021-06-23) Property 'isOverwriteMismatched' does not exist on type '(NameConflictFields & { messageType: "LABWARE_NAME_CONFLICT"; }) | (NameConflictFields & { messageType: "ASK_FOR_LABWARE_OVERWRITE"; defURIToOverwrite: string; isOverwriteMismatched: boolean; })' */}
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

export interface LabwareUploadMessageModalProps {
  message?: LabwareUploadMessage | null
  dismissModal: () => unknown
  overwriteLabwareDef?: () => unknown
}

export const LabwareUploadMessageModal = (
  props: LabwareUploadMessageModalProps
): JSX.Element | null => {
  const { message, dismissModal, overwriteLabwareDef } = props
  if (!message) return null

  let buttons: ButtonProps[] = [{ children: 'OK', onClick: dismissModal }]
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
      <div className={modalStyles.button_row}>
        {buttons.map((button, index) => (
          <OutlineButton
            {...button}
            key={index}
            className={cx(modalStyles.button_medium, button.className)}
          />
        ))}
      </div>
    </AlertModal>
  )
}
