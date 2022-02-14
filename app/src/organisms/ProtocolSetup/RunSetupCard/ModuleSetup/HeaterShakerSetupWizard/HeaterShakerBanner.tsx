import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Banner } from '../../../../../atoms/Banner/Banner'
import { HeaterShakerWizard } from '../../../../Devices/HeaterShakerWizard'

interface HeaterShakerBannerProps {
  displayName: string
}

export function HeaterShakerBanner(
  props: HeaterShakerBannerProps
): JSX.Element | null {
  const [showWizard, setShowWizard] = React.useState(false)
  const { displayName } = props
  const { t } = useTranslation('heater_shaker')

  return (
    <>
      {showWizard && (
        <HeaterShakerWizard onCloseClick={() => setShowWizard(false)} />
      )}
      <Banner
        title={t('banner_title', { name: displayName })}
        body={t('banner_body')}
        btnText={t('banner_wizard_button')}
        onClick={() => setShowWizard(true)}
      />
    </>
  )
}
