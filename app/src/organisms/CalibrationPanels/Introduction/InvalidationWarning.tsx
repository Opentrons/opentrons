import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../atoms/Banner'

// TODO(bc, 2022-08-29): correct invalidation logic once calibration dashboard is in placr
export function InvalidationWarning(): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  return (
    <Banner type="warning">
      {t('tip_length_invalidates_pipette_offset')}
      {t('pipette_offset_requires_tip_length')}
    </Banner>
  )
}
