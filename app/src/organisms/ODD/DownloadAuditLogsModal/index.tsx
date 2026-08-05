import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { SPACING } from '@opentrons/components'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { OddModal } from '/app/molecules/OddModal'
import { useIsLogDeleted } from '/app/resources/audit/useIsLogDeleted'

export function DownloadAuditLogsModal(): JSX.Element {
  const { t } = useTranslation('access_control')

  return (
    <OddModal>
      <OddInfoScreen
        type="neutral"
        header={t('download_audit_logs_in_opentrons_app')}
        subText={t('download_audit_logs_on_device_description')}
        padding={SPACING.spacing24}
        gridGap={SPACING.spacing16}
      />
    </OddModal>
  )
}

const DownloadAuditLogsModalImpl = NiceModal.create(
  ({ logPeriodId }: { logPeriodId: string }): JSX.Element => {
    const modal = useModal()
    const { isLoading, isDeleted } = useIsLogDeleted(logPeriodId)

    useEffect(() => {
      if (!isLoading && isDeleted) {
        modal.resolve(true)
      }
    }, [isDeleted, isLoading, modal])

    return <DownloadAuditLogsModal />
  }
)

/** Open the ODD download audit logs modal. */
export const showDownloadLogsModal = (logPeriodId: string): Promise<boolean> =>
  NiceModal.show(DownloadAuditLogsModalImpl, { logPeriodId })
