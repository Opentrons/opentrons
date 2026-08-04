import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { Icon, Modal, PrimaryButton, StyledText } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import styles from './downloadauditlogsmodal.module.css'

export interface DownloadAuditLogsModalProps {
  logPeriodId: string
  onDownload: () => void
}

export function DownloadAuditLogsModal({
  logPeriodId: _logPeriodId,
  onDownload,
}: DownloadAuditLogsModalProps): JSX.Element {
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
          <PrimaryButton onClick={onDownload}>
            <span className={styles.download_button_content}>
              <Icon name="download" size="1rem" aria-hidden />
              {t('download_audit_logs')}
            </span>
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    getTopPortalEl()
  )
}

const DownloadAuditLogsModalImpl = NiceModal.create(
  ({ logPeriodId }: { logPeriodId: string }): JSX.Element => {
    const modal = useModal()

    const handleDownload = (): void => {
      // TODO(jj, 2026-08-04): implement audit log period download
      modal.resolve(true)
      modal.remove()
    }

    return (
      <DownloadAuditLogsModal
        logPeriodId={logPeriodId}
        onDownload={handleDownload}
      />
    )
  }
)

/** Open the desktop download audit logs modal and await whether logs were downloaded. */
export const showDownloadLogsModal = (logPeriodId: string): Promise<boolean> =>
  NiceModal.show(DownloadAuditLogsModalImpl, { logPeriodId })
