import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StepMeter } from '/app/atoms/StepMeter'
import { CardButton } from '/app/molecules/CardButton'

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

export function NetworkSetupMenu(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'branded'])

  return (
    <>
      <StepMeter totalSteps={6} currentStep={1} />
      <Flex
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing60}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginBottom="3.09375rem"
        >
          <LegacyStyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black90}
          >
            {t('choose_network_type')}
          </LegacyStyledText>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginBottom={SPACING.spacing40}
        >
          <LegacyStyledText
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.grey60}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('branded:network_setup_menu_description')}
          </LegacyStyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          columnGap={SPACING.spacing8}
          height="17rem"
        >
          {NetworkSetupOptions.map(networkOption => (
            <CardButton
              key={networkOption.title}
              {...networkOption}
              title={t(networkOption.title)}
              description={t(networkOption.description)}
            />
          ))}
        </Flex>
      </Flex>
    </>
  )
}
