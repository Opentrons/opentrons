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
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'
import { CardButton } from '../../molecules/CardButton'

import type { IconName } from '@opentrons/components'

const NetworkSetupOptions = [
  {
    cardWidth: '19rem',
    cardHeight: '21.875rem',
    title: 'wifi',
    iconName: 'wifi' as IconName,
    description: 'connection_description',
    destinationPath: '/network-setup/wifi',
  },
  {
    cardWidth: '19rem',
    cardHeight: '21.875rem',
    title: 'ethernet',
    iconName: 'ethernet' as IconName,
    description: 'connection_description',
    destinationPath: '/network-setup/ethernet',
  },
  {
    cardWidth: '19rem',
    cardHeight: '21.875rem',
    title: 'usb',
    iconName: 'usb' as IconName,
    description: 'connection_description',
    destinationPath: '/network-setup/usb',
  },
]

export function NetworkSetupMenu(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <>
      <StepMeter totalSteps={5} currentStep={1} OnDevice />
      <Flex
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginBottom="3.09375rem"
        >
          <StyledText
            fontSize="2rem"
            lineHeight="2.75rem"
            fontWeight="700"
            color={COLORS.black}
          >
            {t('lets_connect_to_a_network')}
          </StyledText>
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginBottom={SPACING.spacingXXL}
        >
          <StyledText
            fontSize="1.375rem"
            lineHeight="1.875rem"
            fontWeight="700"
          >
            {t('choose_your_connection_type')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} columnGap={SPACING.spacing4}>
          {NetworkSetupOptions.map(networkOption => (
            <CardButton
              key={networkOption.title}
              {...networkOption}
              title={t(networkOption.title)}
              description={t(networkOption.description)}
            />
          ))}
        </Flex>
        {/* temp button to robot dashboard until we can detect setup status */}
        <Flex
          alignSelf={ALIGN_FLEX_END}
          marginTop={SPACING.spacing5}
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
