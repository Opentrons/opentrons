import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  ERROR_TOAST,
  Icon,
  INFO_TOAST,
  Modal,
  PrimaryButton,
  StyledText,
  SUCCESS_TOAST,
} from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useCurrentRobotName } from '/app/redux/robot-auth'
import { useDownloadAndDeleteAuditLog } from '/app/resources/audit/useDownloadAndDeleteAuditLog'
import { useIsLogDeleted } from '/app/resources/audit/useIsLogDeleted'

import { useToaster } from '../../ToasterOven'
import styles from './downloadauditlogsmodal.module.css'

import type { IconProps } from '@opentrons/components'

export interface DownloadAuditLogsModalProps {
  onDownload: () => void
  isLoading: boolean
  closeOnOutsideClick?: boolean
  onClose?: () => void
}

export function DownloadAuditLogsModal({
  onDownload,
  isLoading,
  closeOnOutsideClick = false,
  onClose,
}: DownloadAuditLogsModalProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return createPortal(
    <Modal
      type="warning"
      title={t('download_audit_logs')}
      closeOnOutsideClick={closeOnOutsideClick}
      childrenPadding="var(--spacing-24)"
      onClose={onClose}
    >
      <div className={styles.content}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('download_audit_logs_description')}
        </StyledText>
        <div className={styles.button_row}>
          <PrimaryButton onClick={onDownload} disabled={isLoading}>
            <span className={styles.download_button_content}>
              <Icon
                name={isLoading ? 'ot-spinner' : 'download'}
                size="1rem"
                aria-hidden
                spin={isLoading}
              />
              {t('download_now')}
            </span>
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    getTopPortalEl()
  )
}

const DownloadAuditLogsModalImpl = NiceModal.create(
  ({ logPeriodId }: { logPeriodId: string }): JSX.Element | null => {
    const modal = useModal()
    const robotName = useCurrentRobotName()

    useEffect(() => {
      if (robotName == null) {
        modal.resolve(false)
        modal.remove()
      }
    }, [modal, robotName])

    if (robotName == null) {
      return null
    }

    return (
      <ApiHostProvider robotName={robotName}>
        <DownloadAuditLogsModalContent logPeriodId={logPeriodId} />
      </ApiHostProvider>
    )
  }
)

function DownloadAuditLogsModalContent({
  logPeriodId,
}: {
  logPeriodId: string
}): JSX.Element {
  const { t } = useTranslation('device_details')
  const modal = useModal()
  const { makeToast, eatToast } = useToaster()

  const { downloadAndDeleteAuditLog, isLoading } =
    useDownloadAndDeleteAuditLog(logPeriodId)

  const handleDownload = (): void => {
    const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
    const inProgressToastId = makeToast(
      t('downloading_log_periods') as string,
      INFO_TOAST,
      { disableTimeout: true, icon: toastIcon }
    )
    downloadAndDeleteAuditLog()
      .then(() => {
        makeToast(t('files_successfully_downloaded') as string, SUCCESS_TOAST)
        modal.resolve(true)
        modal.remove()
      })
      .catch((error: unknown) => {
        if (isDocumentedMutationError(error)) {
          return
        }
        const message =
          error instanceof Error && error.message.length > 0
            ? error.message
            : String(error)
        const casedMessage = message.charAt(0).toUpperCase() + message.slice(1)
        makeToast(casedMessage, ERROR_TOAST, { closeButton: true })
        modal.reject(error)
        modal.remove()
      })
      .finally(() => {
        eatToast(inProgressToastId)
      })
  }

  const { isDeleted, isLoading: isLogDeletedLoading } =
    useIsLogDeleted(logPeriodId)

  useEffect(() => {
    if (!isLogDeletedLoading && isDeleted) {
      modal.resolve(true)
      modal.remove()
    }
  }, [isDeleted, isLogDeletedLoading, modal])

  return (
    <DownloadAuditLogsModal onDownload={handleDownload} isLoading={isLoading} />
  )
}

/** Open the desktop download audit logs modal and await whether logs were downloaded. */
export const showDownloadLogsModal = (logPeriodId: string): Promise<boolean> =>
  NiceModal.show(DownloadAuditLogsModalImpl, { logPeriodId })
