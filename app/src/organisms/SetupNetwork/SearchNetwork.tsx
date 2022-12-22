import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
  Btn,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'

export function SearchNetwork(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const history = useHistory()
  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom="3.041875rem">
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375rem">
          {t('connect_via', { type: t('wifi') })}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          height="22rem"
          backgroundColor="#D6D6D6"
          justifyContent={JUSTIFY_CENTER}
          borderRadius="12px"
        >
          <Flex
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
          >
            <Icon
              name="ot-spinner"
              size="5.125rem"
              color={COLORS.darkGreyEnabled}
              aria-label="spinner"
              spin
            />
            <StyledText
              fontSize="2rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight="2.72375rem"
              marginTop={SPACING.spacingXXL}
            >
              {t('searching_for_networks')}
            </StyledText>
          </Flex>
        </Flex>
        <Btn
          onClick={() => history.push('/network-setup/wifi/set-wifi-ssid')}
          marginTop={SPACING.spacing3}
          width="59rem"
          height="4rem"
          backgroundColor="#d6d6d6"
          borderRadius="12px"
        >
          <Flex
            padding={SPACING.spacing4}
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
          >
            <Icon name="plus" size="2.25rem" color={COLORS.darkGreyEnabled} />
            <StyledText
              marginLeft={SPACING.spacingSM}
              color={COLORS.black}
              fontSize="1.5rem"
              lineHeight="1.8125rem"
              fontWeight="400"
            >
              {t('join_other_network')}
            </StyledText>
          </Flex>
        </Btn>
      </Flex>
    </>
  )
}
