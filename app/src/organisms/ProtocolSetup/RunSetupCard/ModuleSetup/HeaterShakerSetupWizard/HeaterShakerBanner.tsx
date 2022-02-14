import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../../../atoms/Banner/Banner'

interface HeaterShakerBannerProps {
  displayName: string
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const { displayName } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <Banner
      title={t('banner_title', { name: displayName })}
      body={t('banner_body')}
      btnText={t('banner_wizard_button')}
      onClick={() => console.log('proceed to wizard')}
    />
  )
}
