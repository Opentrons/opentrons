import { useTranslation } from 'react-i18next'
import NiceModal from '@ebay/nice-modal-react'

import { SPACING } from '@opentrons/components'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { OddModal } from '/app/molecules/OddModal'

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

const DownloadAuditLogsModalImpl = NiceModal.create(DownloadAuditLogsModal)

/** Open the ODD download audit logs modal. */
export const showDownloadLogsModal = (_logPeriodId: string): Promise<boolean> =>
  NiceModal.show(DownloadAuditLogsModalImpl)
