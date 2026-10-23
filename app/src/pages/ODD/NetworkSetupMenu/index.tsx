import { useTranslation } from 'react-i18next'

import {
  COLORS,
  LegacyStyledText,
  StepMeter,
  TYPOGRAPHY,
} from '@opentrons/components'

import { CardButton } from '/app/molecules/CardButton'

import styles from './networksetupmenu.module.css'

import type { ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

const NetworkSetupOptions = [
  {
    title: 'wifi',
    iconName: 'wifi' as IconName,
    description: 'connection_description_wifi',
    destinationPath: '/network-setup/wifi',
  },
  {
    title: 'ethernet',
    iconName: 'ethernet' as IconName,
    description: 'connection_description_ethernet',
    destinationPath: '/network-setup/ethernet',
  },
  {
    title: 'usb',
    iconName: 'usb' as IconName,
    description: 'branded:connection_description_usb',
    destinationPath: '/network-setup/usb',
  },
]

export function NetworkSetupMenu(): ReactNode {
  const { t } = useTranslation(['device_settings', 'branded'])

  return (
    <>
      <StepMeter totalSteps={6} currentStep={1} />
      <div className={styles.container}>
        <div className={styles.title_row}>
          <LegacyStyledText
            forwardedAs="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black90}
          >
            {t('choose_network_type')}
          </LegacyStyledText>
        </div>
        <div className={styles.description_row}>
          <LegacyStyledText
            forwardedAs="h4"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('branded:network_setup_menu_description')}
          </LegacyStyledText>
        </div>
        <div className={styles.card_button_row}>
          {NetworkSetupOptions.map(networkOption => (
            <div
              className={styles.card_button_wrapper}
              key={networkOption.title}
            >
              <CardButton
                {...networkOption}
                title={t(networkOption.title)}
                description={t(networkOption.description)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
