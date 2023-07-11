import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_ROW,
  ALIGN_FLEX_END,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'
import { CardButton } from '../../molecules/CardButton'

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
    description: 'connection_description_usb',
    destinationPath: '/network-setup/usb',
  },
]

export function NetworkSetupMenu(): JSX.Element {
  const { t } = useTranslation('device_settings')

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
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black}
          >
            {t('connect_to_a_network')}
          </StyledText>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginBottom={SPACING.spacing40}
        >
          <StyledText
            as="h4"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.darkBlack70}
            textAlign={TYPOGRAPHY.textAlignCenter}
          >
            {t('network_setup_menu_description')}
          </StyledText>
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
        <Flex
          alignSelf={ALIGN_FLEX_END}
          marginTop={SPACING.spacing24}
          width="fit-content"
        >
          <Link to="menu">
            <TertiaryButton>To ODD Menu</TertiaryButton>
          </Link>
        </Flex>
      </Flex>
    </>
  )
}
