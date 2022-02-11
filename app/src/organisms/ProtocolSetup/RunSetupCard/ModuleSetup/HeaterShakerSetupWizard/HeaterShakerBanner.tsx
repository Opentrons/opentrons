import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../../../atoms/Banner/Banner'

interface HeaterShakerBannerProps {
  model: string
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const { model } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <Banner
      title={t('banner_title', { name: model })}
      body={t('banner_body')}
      btnText={t('banner_wizard_button')}
      onClick={() => console.log('proceed to wizard')}
    />
  )
}
