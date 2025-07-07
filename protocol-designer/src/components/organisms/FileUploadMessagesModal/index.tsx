import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import {
  dismissFileUploadMessage,
  undoLoadFile,
} from '../../../load-file/actions'
import { getFileUploadMessages } from '../../../load-file/selectors'
import { useFileUploadModalContents } from './utils'

export function FileUploadMessagesModal(): JSX.Element | null {
  const message = useSelector(getFileUploadMessages)
  const dispatch = useDispatch()
  const { t } = useTranslation('shared')
  const modalContents = useFileUploadModalContents({
    uploadResponse: message,
  })
  const dismissModal = (): void => {
    dispatch(dismissFileUploadMessage())
  }

  if (modalContents == null) {
    return null
  }

  const { title, body } = modalContents

  const isMigration = title === t('migration_header')

  const showButtons =
    title !== t('invalid_json_file') &&
    title !== t('incorrect_file_header') &&
    title !== t('incorrect_python_file_header')

  const handleClose = (): void => {
    if (isMigration) {
      dispatch(undoLoadFile())
    } else {
      dismissModal()
    }
  }

  return (
    <Modal
      marginLeft="0"
      type={message?.isError ? 'error' : 'info'}
      title={title}
      closeOnOutsideClick
      onClose={handleClose}
      footer={
        showButtons && (
          <Flex
            padding={SPACING.spacing24}
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
          >
            <SecondaryButton
              onClick={() => {
                dispatch(undoLoadFile())
              }}
            >
              {t('cancel')}
            </SecondaryButton>
            <PrimaryButton onClick={dismissModal}>
              {isMigration ? t('import') : t('confirm')}
            </PrimaryButton>
          </Flex>
        )
      }
    >
      {body}
    </Modal>
  )
}
