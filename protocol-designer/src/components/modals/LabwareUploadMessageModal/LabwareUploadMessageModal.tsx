import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import assert from 'assert'
import cx from 'classnames'
import { AlertModal, OutlineButton, ButtonProps } from '@opentrons/components'
import modalStyles from '../modal.module.css'
import {
  selectors as labwareDefSelectors,
  actions as labwareDefActions,
  LabwareUploadMessage,
} from '../../../labware-defs'

const MessageBody = (props: {
  message: LabwareUploadMessage
}): JSX.Element | null => {
  const { message } = props
  const { t } = useTranslation('modal')
  if (
    message.messageType === 'EXACT_LABWARE_MATCH' ||
    message.messageType === 'INVALID_JSON_FILE' ||
    message.messageType === 'ONLY_TIPRACK' ||
    message.messageType === 'NOT_JSON' ||
    message.messageType === 'USES_STANDARD_NAMESPACE'
  ) {
    return (
      <>
        <p>{t(`labware_upload_message.message.${message.messageType}`)}</p>
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
          {t('labware_upload_message.name_conflict.shares_name', {
            customOrStandard: canOverwrite ? 'custom' : 'Opentrons standard',
          })}
        </p>
        {canOverwrite && defsMatchingLoadName.length > 0 ? (
          <p>
            <strong>
              {t('labware_upload_message.name_conflict.shared_load_name')}
              {defsMatchingLoadName
                .map(def => def?.parameters.loadName || '?')
                .join(', ')}
            </strong>
          </p>
        ) : null}
        {canOverwrite && defsMatchingDisplayName.length > 0 ? (
          <p>
            <strong>
              {t('labware_upload_message.name_conflict.shared_display_name')}
              {defsMatchingDisplayName
                .map(def => def?.metadata.displayName || '?')
                .join(', ')}
            </strong>
          </p>
        ) : null}
        <p>{t('labware_upload_message.name_conflict.re_export')}</p>
        {canOverwrite && (
          <p>{t('labware_upload_message.name_conflict.overwrite')}</p>
        )}
        {canOverwrite &&
          'isOverwriteMismatched' in message &&
          message.isOverwriteMismatched && (
            <p>
              <strong>
                {t('labware_upload_message.name_conflict.warning')}
              </strong>{' '}
              {t('labware_upload_message.name_conflict.mismatched')}
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

export const LabwareUploadMessageModal = (): JSX.Element | null => {
  const message = useSelector(labwareDefSelectors.getLabwareUploadMessage)
  const dispatch = useDispatch()
  const { t } = useTranslation('modal')
  const dismissModal = (): void => {
    dispatch(labwareDefActions.dismissLabwareUploadMessage())
  }
  const overwriteLabwareDef = (): void => {
    if (message && message.messageType === 'ASK_FOR_LABWARE_OVERWRITE') {
      dispatch(
        labwareDefActions.replaceCustomLabwareDef({
          defURIToOverwrite: message.defURIToOverwrite,
          newDef: message.newDef,
          isOverwriteMismatched: message.isOverwriteMismatched,
        })
      )
    } else {
      assert(
        false,
        `labware def should only be overwritten when messageType is ASK_FOR_LABWARE_OVERWRITE. Got ${String(
          message?.messageType
        )}`
      )
    }
  }

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
      heading={t(`labware_upload_message.title.${message.messageType}`)}
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
