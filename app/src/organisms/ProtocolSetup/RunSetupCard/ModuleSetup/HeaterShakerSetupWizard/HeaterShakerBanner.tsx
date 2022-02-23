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
        title={t('attach_heater_shaker_to_deck', { name: displayName })}
        body={t('attach_to_deck_to_prevent_shaking')}
        btnText={t('how_to_attach_module')}
        onClick={() => setShowWizard(true)}
      />
    </>
  )
}
