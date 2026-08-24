import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { Icon, Modal, PrimaryButton, StyledText } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useCurrentRobotName } from '/app/redux/robot-auth'
import { useDownloadAndDeleteAuditLog } from '/app/resources/audit/useDownloadAndDeleteAuditLog'
import { useIsLogDeleted } from '/app/resources/audit/useIsLogDeleted'

import styles from './downloadauditlogsmodal.module.css'

import type { ReactNode } from 'react'

export interface DownloadAuditLogsModalProps {
  onDownload: () => void
  isLoading: boolean
}

export function DownloadAuditLogsModal({
  onDownload,
  isLoading,
}: DownloadAuditLogsModalProps): ReactNode {
  const { t } = useTranslation('access_control')

  return createPortal(
    <Modal
      type="warning"
      title={t('download_audit_logs')}
      closeOnOutsideClick={false}
      childrenPadding="var(--spacing-24)"
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
}): ReactNode {
  const modal = useModal()

  const { downloadAndDeleteAuditLog, isLoading } =
    useDownloadAndDeleteAuditLog(logPeriodId)

  const handleDownload = (): void => {
    downloadAndDeleteAuditLog()
      .then(() => {
        modal.resolve(true)
      })
      .catch(error => {
        modal.reject(error)
      })
      .finally(() => {
        modal.remove()
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
