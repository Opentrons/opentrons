import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  Icon,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { OnDeviceDisplayContainer } from '../../molecules/OnDeviceDisplayContainer'
import usbImage from '../../assets/images/odd/usb@x2.png'

// fetch ethernet information if ip address + subnet mask -> display connected

export function ConnectViaUsb(): JSX.Element {
  return (
    <OnDeviceDisplayContainer
      isStepMeter
      totalSteps={4}
      currentStep={1}
      headerContent={headerContent()}
      bodyContent={bodyContent()}
    />
  )
}

function headerContent(): React.ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      position={POSITION_RELATIVE}
      marginBottom={SPACING.spacingXXL}
    >
      <Btn position={POSITION_ABSOLUTE} left="0">
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon name="arrow-back" size="1.9375rem" />
          <StyledText
            fontSize="1.625rem"
            lineHeight="2.1875rem"
            fontWeight="700"
          >
            {t('shared:back')}
          </StyledText>
        </Flex>
      </Btn>
      <Flex>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('connect_via_usb')}
        </StyledText>
      </Flex>
    </Flex>
  )
}

const bodyContent = (): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.darkGreyDisabled}
      flexDirection={DIRECTION_COLUMN}
      height="26.3125rem"
    >
      <img
        width="322"
        height="181"
        alt="connect to a robot via "
        src={usbImage}
      />
      <StyledText
        marginTop={SPACING.spacing6}
        marginX={SPACING.spacingXXL}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        {t('connect_ot3_via_usb')}
      </StyledText>
    </Flex>
  )
}

const connectedContent = (description: string): JSX.Element => (
  <Flex
    justifyContent={JUSTIFY_CENTER}
    alignItems={ALIGN_CENTER}
    backgroundColor={COLORS.successBackgroundMed}
    flexDirection={DIRECTION_COLUMN}
    height="20.4375rem"
  >
    <Icon name="ot-check" size="4.375rem" color={COLORS.successEnabled} />
    <StyledText
      marginTop={SPACING.spacingXXL}
      textAlign={TYPOGRAPHY.textAlignCenter}
      color={COLORS.black}
    >
      {description}
    </StyledText>
  </Flex>
)
