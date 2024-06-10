import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING, StyledText } from '@opentrons/components'
import { Banner } from '../../atoms/Banner'

import type { IconProps } from '@opentrons/components'

export function ProtocolStatusBanner(): JSX.Element {
  const { t } = useTranslation('protocol_list')

  const alertIcon: IconProps = { name: 'alert-circle' }
  return (
    <Banner
      type="warning"
      icon={alertIcon}
      width="100%"
      iconMarginLeft={SPACING.spacing4}
    >
      <StyledText>{t('csv_file_required')}</StyledText>
    </Banner>
  )
}
