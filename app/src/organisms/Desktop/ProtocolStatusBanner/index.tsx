import { useTranslation } from 'react-i18next'

import { Banner, LegacyStyledText, SPACING } from '@opentrons/components'

import type { ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'

export function ProtocolStatusBanner(): ReactNode {
  const { t } = useTranslation('protocol_list')

  const alertIcon: IconProps = { name: 'ot-alert' }
  return (
    <Banner
      type="warning"
      icon={alertIcon}
      iconMarginLeft={SPACING.spacing4}
      marginRight={SPACING.spacing24}
    >
      <LegacyStyledText>{t('csv_file_required')}</LegacyStyledText>
    </Banner>
  )
}
