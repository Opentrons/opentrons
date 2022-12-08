import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
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
import { StepMeter } from '../../atoms/StepMeter'
// import { PrimaryButton } from '../../atoms/buttons'
import usbImage from '../../assets/images/odd/usb@x2.png'

// Note: kj 12/06/2022 The commented-out lines will be activated when the check function is ready
export function ConnectViaUSB(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  // const [isConnected, setIsConnected] = React.useState<boolean>(true)
  // const connectedDescription = t('successfully_connected')
  // const buttonLabel = t('next_step')

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          position={POSITION_RELATIVE}
          marginBottom={SPACING.spacingXXL}
        >
          {/* this path is temporary and it will be update soon */}
          <Btn
            position={POSITION_ABSOLUTE}
            left="0"
            onClick={() => history.push('/network-setup')}
          >
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
              {t('connect_via', { type: t('usb') })}
            </StyledText>
          </Flex>
        </Flex>
        {/* {isConnected ? (
          <ConnectedViaDesktopApp
            description={connectedDescription}
            buttonLabel={buttonLabel}
          />
        ) : ( */}
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
            {t('connect_via_usb_description')}
          </StyledText>
        </Flex>
        {/* )} */}
      </Flex>
    </>
  )
}

// interface ConnectedViaDesktopAppProps {
//   description: string
//   buttonLabel: string
// }

// ToDo: kj 12/06/2022 need a function to check the robot has been connected via the desktop app
// Frank will be able to add that
/*
const ConnectedViaDesktopApp = ({
  description,
  buttonLabel,
}: ConnectedViaDesktopAppProps): JSX.Element => (
  <>
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
        fontSize="1.625rem"
        lineHeight="2.1875rem"
        fontWeight="700"
      >
        {description}
      </StyledText>
    </Flex>
    <PrimaryButton marginTop={SPACING.spacing5} height="4.4375rem" width="100%">
      <StyledText fontSize="1.5rem" lineHeight="1.375rem" fontWeight="500">
        {buttonLabel}
      </StyledText>
    </PrimaryButton>
  </>
)
*/
