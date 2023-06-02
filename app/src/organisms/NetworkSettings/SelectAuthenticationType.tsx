import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

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
  TYPOGRAPHY,
  DISPLAY_FLEX,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { RadioButton, SmallButton } from '../../atoms/buttons'
import { getLocalRobot } from '../../redux/discovery'
import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'
import { AlternativeSecurityTypeModal } from './AlternativeSecurityTypeModal'
import { useIsFinishedUnboxing } from '../OnDeviceDisplay/RobotSettingsDashboard/NetworkSettings/hooks'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch, State } from '../../redux/types'
import type { NetworkChangeState } from '../Devices/RobotSettings/ConnectNetwork/types'

interface SelectAuthenticationTypeProps {
  ssid: string
  fromWifiList?: boolean
  selectedAuthType: WifiSecurityType
  setShowSelectAuthenticationType: (
    isShowSelectAuthenticationType: boolean
  ) => void
  setSelectedAuthType: (authType: WifiSecurityType) => void
  setChangeState: (changeState: NetworkChangeState) => void
  setShowInterfaceTitle?: (showInterfaceTitle: boolean) => void
}

export function SelectAuthenticationType({
  ssid,
  fromWifiList,
  selectedAuthType,
  setShowSelectAuthenticationType,
  setSelectedAuthType,
  setChangeState,
  setShowInterfaceTitle,
}: SelectAuthenticationTypeProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const [
    showAlternativeSecurityTypeModal,
    setShowAlternativeSecurityTypeModal,
  ] = React.useState<boolean>(false)
  const isInitialSetup = useIsFinishedUnboxing()

  const handleClickBack = (): void => {
    if (fromWifiList != null) {
      // back to wifi list
      setChangeState({ type: null })
      if (!isInitialSetup && setShowInterfaceTitle != null)
        setShowInterfaceTitle(true)
    } else {
      // back to set wifi ssid
      // Note: This will be updated by PR-#11917
      console.log('go back to SetWifiSsid screen')
    }
  }

  const securityButtons = [
    {
      label: t('wpa2_personal'),
      subLabel: t('wpa2_personal_description'),
      value: 'wpa-psk',
    },
    {
      label: t('shared:none'),
      subLabel: t('none_description'),
      value: 'none',
    },
  ]

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedAuthType(event.target.value as WifiSecurityType)
  }

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

  return (
    <>
      {showAlternativeSecurityTypeModal ? (
        <AlternativeSecurityTypeModal
          setShowAlternativeSecurityTypeModal={
            setShowAlternativeSecurityTypeModal
          }
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={
            isInitialSetup ? JUSTIFY_CENTER : JUSTIFY_SPACE_BETWEEN
          }
          position={POSITION_RELATIVE}
          alignItems={ALIGN_CENTER}
          marginBottom="2.2625rem"
        >
          <Flex position={POSITION_ABSOLUTE} left="0">
            <Btn onClick={handleClickBack}>
              <Flex flexDirection={DIRECTION_ROW}>
                <Icon name="back" marginRight={SPACING.spacing4} size="3rem" />
              </Flex>
            </Btn>
          </Flex>
          <Flex marginLeft={isInitialSetup ? '0' : '4rem'}>
            <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('select_a_security_type')}
            </StyledText>
          </Flex>
          <Flex position={POSITION_ABSOLUTE} right="0">
            <SmallButton
              buttonType="primary"
              buttonCategory="rounded"
              buttonText={i18n.format(t('continue'), 'capitalize')}
              onClick={() => {
                setShowSelectAuthenticationType(false)
              }}
            />
          </Flex>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="100%"
          >
            {securityButtons.map(radio => (
              <RadioButton
                key={radio.label}
                buttonLabel={radio.label}
                buttonValue={radio.value}
                onChange={handleChange}
                subButtonLabel={radio.subLabel ?? undefined}
                isSelected={radio.value === selectedAuthType}
              />
            ))}
          </Flex>
          <Flex marginTop="1.75rem">
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkBlack70}
            >
              {t('your_mac_address_is', { macAddress: wifi?.macAddress })}
            </StyledText>
          </Flex>
          <Btn
            display={DISPLAY_FLEX}
            marginTop={SPACING.spacing40}
            width="100%"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            onClick={() => setShowAlternativeSecurityTypeModal(true)}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack70}
            >
              {t('need_another_security_type')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
    </>
  )
}
