import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Icon,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getModalPortalEl } from '/app/App/portal'
import { useDownloadRunLog } from '/app/organisms/Desktop/Devices/hooks'

import styles from './gallery.module.css'

import type { MouseEventHandler, ReactNode } from 'react'
import type { ModalProps } from '@opentrons/components'
import type { RunTimeCommand } from '@opentrons/shared-data'

export interface GalleryItemErrorModalProps {
  erroredCommand: RunTimeCommand
  runId: string
  robotName: string
  toggleModal: () => void
}

export function GalleryItemErrorModal({
  erroredCommand,
  runId,
  toggleModal,
  robotName,
}: GalleryItemErrorModalProps): ReactNode {
  const { i18n, t } = useTranslation(['run_details', 'shared', 'branded'])
  const { downloadRunLog } = useDownloadRunLog(robotName, runId)

  const handleClick = (): void => {
    toggleModal()
  }

  const handleDownloadClick: MouseEventHandler<HTMLAnchorElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    downloadRunLog()
  }

  const buildModalProps = (): ModalProps => ({
    hasHeader: true,
    title: t('error_details'),
    onClose: toggleModal,
    type: 'error',
    closeOnOutsideClick: true,
  })

  return createPortal(
    <Modal {...buildModalProps()}>
      <div className={styles.error_container}>
        <ErrorContent erroredCommand={erroredCommand} />
        <LegacyStyledText forwardedAs="p">
          {t('branded:run_failed_modal_description_desktop')}
        </LegacyStyledText>
        <div className={styles.error_footer_container}>
          <Link css={TYPOGRAPHY.linkPSemiBold} onClick={handleDownloadClick}>
            <div className={styles.error_icon_container}>
              <Icon name="download" size="1rem" />
              {i18n.format(t('download_run_log'), 'titleCase')}
            </div>
          </Link>
          <PrimaryButton onClick={handleClick}>
            {i18n.format(t('shared:close'), 'capitalize')}
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    getModalPortalEl()
  )
}

export function ErrorContent({
  erroredCommand,
}: {
  erroredCommand: RunTimeCommand
}): ReactNode {
  return (
    <div className={styles.error_content_container}>
      <div className={styles.error_message_container}>
        {erroredCommand?.error != null && (
          <LegacyStyledText
            forwardedAs="p"
            textAlign={TYPOGRAPHY.textAlignLeft}
          >
            {`${erroredCommand.error.errorCode}: ${erroredCommand.error.detail}`}
          </LegacyStyledText>
        )}
      </div>
    </div>
  )
}
