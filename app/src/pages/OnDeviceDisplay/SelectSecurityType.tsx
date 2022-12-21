import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  SPACING,
  Btn,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'
import { TertiaryButton } from '../../atoms/buttons'
import { getLocalRobot } from '../../redux/discovery'
import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'

import type { Dispatch, State } from '../../redux/types'
import type { OnDeviceRouteParams } from '../../App/types'

export function SelectSecurityType(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const { ssid } = useParams<OnDeviceRouteParams>()
  const dispatch = useDispatch<Dispatch>()
  // ToDo kj 12/20/2022 use this for two buttons(wpa2-personal and none) styling and this will be passed to another component
  // waiting the response from the designer
  const [securityType, setSecurityType] = React.useState<'wpa' | 'none'>('wpa')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const macAddress = wifi?.macAddress

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          marginBottom="2.2625rem"
        >
          <Btn onClick={() => history.push('/network-setup/wifi')}>
            <Flex flexDirection={DIRECTION_ROW}>
              <Icon
                name="arrow-back"
                marginRight={SPACING.spacing2}
                size="1.875rem"
              />
              <StyledText
                fontSize="1.625rem"
                lineHeight="2.1875rem"
                fontWeight="700"
              >
                {t('shared:back')}
              </StyledText>
            </Flex>
          </Btn>
          <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
            {t('connect_to', { ssid: ssid })}
          </StyledText>
          <TertiaryButton
            width="8.9375rem"
            height="3.75rem"
            fontSize="1.5rem"
            fontWeight="500"
            lineHeight="2.0425rem"
            onClick={() =>
              history.push(
                `/network-setup/wifi/set-wifi-cred/${ssid}/${securityType}`
              )
            }
          >
            {t('shared:next')}
          </TertiaryButton>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
          <StyledText
            fontSize="1.375rem"
            lineHeight="1.875rem"
            fontWeight="500"
          >
            {t('select_authentication_method')}
          </StyledText>
          <Flex
            marginTop={SPACING.spacing5}
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            gridGap="1.375rem"
          >
            <Btn
              backgroundColor={COLORS.medBlue}
              padding={`${String(SPACING.spacing4)} ${String(
                SPACING.spacing6
              )}`}
              borderRadius="3.5625rem"
              onClick={() => setSecurityType('wpa')}
            >
              <StyledText
                fontSize="2rem"
                lineHeight="2.75rem"
                fontWeight="600"
                color={COLORS.blueEnabled}
              >
                {t('wpa2_personal')}
              </StyledText>
            </Btn>
            <Btn
              padding={`${String(SPACING.spacing4)} ${String(
                SPACING.spacing6
              )}`}
              onClick={() => setSecurityType('none')}
            >
              <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="600">
                {t('shared:none')}
              </StyledText>
            </Btn>
          </Flex>
          {/* Note kj I hard-coded MAC Address because we have text item that is with bold style, if that is reuseable for the hi-fi, I will switch.
            Otherwise, I will add this as a new item to a json file */}
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing2}
            marginTop="7.8125rem"
          >
            <StyledText
              fontSize="1.5rem"
              lineHeight="2.0625rem"
              fontWeight="400"
              color={COLORS.black}
            >
              {'MAC Address:'}
            </StyledText>
            <StyledText
              fontSize="1.5rem"
              lineHeight="2.0625rem"
              fontWeight="400"
              color={COLORS.black}
            >
              {macAddress}
            </StyledText>
          </Flex>
          <Flex
            marginTop={SPACING.spacing5}
            backgroundColor="#E0E0E0"
            padding={SPACING.spacing5}
            width="100%"
            height="6.75rem"
            borderRadius="12px"
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
          >
            <StyledText
              fontSize="1.375rem"
              lineHeight="1.875rem"
              fontWeight="500"
              width="665px"
            >
              {t('switch_to_usb_description')}
            </StyledText>
            <Btn
              marginLeft={SPACING.spacingSM}
              padding={`0.75rem ${String(SPACING.spacing5)}`}
              width="13.8125rem"
            >
              <StyledText
                fontSize="1.375rem"
                lineHeight="1.875rem"
                fontWeight="600"
              >
                {t('connect_via', { type: t('usb') })}
              </StyledText>
            </Btn>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
