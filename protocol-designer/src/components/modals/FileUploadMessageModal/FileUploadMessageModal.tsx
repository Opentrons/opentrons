import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { AlertModal, OutlineButton } from '@opentrons/components'
import {
  selectors as loadFileSelectors,
  actions as loadFileActions,
} from '../../../load-file'
import { getModalContents } from './modalContents'
import modalStyles from '../modal.css'

export function FileUploadMessageModal(): JSX.Element | null {
  const message = useSelector(loadFileSelectors.getFileUploadMessages)
  const dispatch = useDispatch()
  const { t } = useTranslation(['modal', 'button'])

  const dismissModal = (): void => {
    dispatch(loadFileActions.dismissFileUploadMessage())
  }
  if (!message) return null

  const { title, body, okButtonText } = getModalContents({
    uploadResponse: message,
    t,
  })
  let buttons = [
    {
      children: t('button:cancel'),
      onClick: () => dispatch(loadFileActions.undoLoadFile()),
      className: modalStyles.bottom_button,
    },
    {
      children: okButtonText || t('button:ok'),
      onClick: dismissModal,
      className: modalStyles.button_medium,
    },
  ]
  if (title === t('incorrect_file.header') || title === t('invalid.header')) {
    buttons = [
      {
        children: okButtonText || t('button:ok'),
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
