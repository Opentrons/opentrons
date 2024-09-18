import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING, LegacyStyledText } from '@opentrons/components'
import { Banner } from '/app/atoms/Banner'

import type { IconProps } from '@opentrons/components'

export function ProtocolStatusBanner(): JSX.Element {
  const { t } = useTranslation('protocol_list')

  const alertIcon: IconProps = { name: 'alert-circle' }
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
