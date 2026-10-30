import { useTranslation } from 'react-i18next'

import { Banner, SPACING, StyledText } from '@opentrons/components'

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
      <StyledText>{t('csv_file_required')}</StyledText>
    </Banner>
  )
}
