import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, Link } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Icon,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  JUSTIFY_CENTER,
  PrimaryButton,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { TertiaryButton } from '../../../atoms/buttons'
import {
  getNetworkInterfaces,
  fetchStatus,
  fetchWifiList,
} from '../../../redux/networking'
import { getLocalRobot } from '../../../redux/discovery'

import type { State, Dispatch } from '../../../redux/types'
import type {
  SimpleInterfaceStatus,
  WifiNetwork,
  WifiSecurityType,
} from '../../../redux/networking/types'

interface WifiConnectionDetailsProps {
  ssid?: string
  authType?: WifiSecurityType
  showHeader?: boolean
  showWifiListButton?: boolean
  wifiList?: WifiNetwork[]
}

export function WifiConnectionDetails({
  ssid,
  authType,
  showHeader = true,
  showWifiListButton = false,
  wifiList,
}: WifiConnectionDetailsProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    dispatch(fetchWifiList(robotName))
  }, [robotName, dispatch])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing5}>
      {showHeader && <TitleHeader />}
      <DisplayConnectionStatus connected={wifi != null} />
      <DisplayConnectedNetworkInfo
        wifi={wifi}
        ssid={ssid}
        authType={authType ?? 'none'}
      />
      <DisplayButtons showWifiListButton={showWifiListButton} />
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
  )
}

// Note: kj 12/22/2022 the followings might be a component for network setup process
// but still the design is the mid-fi
const TitleHeader = (): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginBottom="1.5625rem"
    >
      <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
        {t('connect_via', { type: t('wifi') })}
      </StyledText>
    </Flex>
  )
}

interface DisplayConnectionStatusProps {
  connected: boolean
}

const DisplayConnectionStatus = ({
  connected,
}: DisplayConnectionStatusProps): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      padding={`${String(SPACING.spacing5)} ${String(SPACING.spacingXXL)}`}
      backgroundColor={
        connected ? COLORS.successBackgroundMed : COLORS.light_two
      }
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.size_three}
    >
      <Icon
        name="ot-check"
        size="2.5rem"
        color={connected ? COLORS.successEnabled : COLORS.light_two}
      />
      <StyledText
        marginLeft={SPACING.spacing5}
        fontSize="1.625rem"
        fontWeight="700"
        lineHeight="2.1875rem"
        color={COLORS.black}
      >
        {t('connection_status')}
      </StyledText>
      <StyledText
        marginLeft="0.625rem"
        fontSize="1.625rem"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        lineHeight="2.1875rem"
        color={COLORS.black}
      >
        {t(connected ? 'connected' : 'not_connected')}
      </StyledText>
    </Flex>
  )
}

interface DisplayConnectedNetworkInfoProps {
  ssid?: string
  wifi: SimpleInterfaceStatus | null
  authType: WifiSecurityType
}

const DisplayConnectedNetworkInfo = ({
  wifi,
  ssid,
  authType,
}: DisplayConnectedNetworkInfoProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      paddingX={SPACING.spacing6}
      paddingY={SPACING.spacing5}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      backgroundColor={COLORS.darkGreyDisabled}
      borderRadius={BORDERS.size_three}
    >
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Icon name="wifi" size="2.4rem" />
        <StyledText
          marginLeft={SPACING.spacing2}
          fontSize="1.5rem"
          lineHeight="1.8rem"
          fontWeight="700"
        >
          {ssid ?? t('shared:no_data')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        textAlign={TYPOGRAPHY.textAlignRight}
        gridGap={SPACING.spacing2}
      >
        <StyledText fontSize="1.5rem" lineHeight="2.0625rem" fontWeight="400">
          {/* ToDo: if wifi is undefined no data or empty */}
          {`${t('ip_address')}:  ${wifi?.ipAddress ?? 'No data'}`}
        </StyledText>
        <StyledText fontSize="1.5rem" lineHeight="2.0625rem" fontWeight="400">
          {`Authentication: ${String(
            authType === 'wpa-psk' ? 'WPA2' : 'None'
          )}`}
        </StyledText>
        <StyledText fontSize="1.5rem" lineHeight="2.0625rem" fontWeight="400">
          {`${t('subnet_mask')}: ${wifi?.subnetMask ?? 'No data'}`}
        </StyledText>
        <StyledText fontSize="1.5rem" lineHeight="2.0625rem" fontWeight="400">
          {`${t('mac_address')}: ${wifi?.macAddress ?? 'No data'}`}
        </StyledText>
      </Flex>
    </Flex>
  )
}

interface DisplayButtonsProps {
  showWifiListButton: boolean
}

const DisplayButtons = ({
  showWifiListButton,
}: DisplayButtonsProps): JSX.Element => {
  const { t } = useTranslation('device_settings')
  const history = useHistory()
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap="0.75rem"
      height="4.375rem"
      marginTop="1.4375rem"
    >
      {showWifiListButton ? (
        <PrimaryButton
          onClick={() => console.log('Not implemented')}
          width="100%"
        >
          <StyledText
            fontSize="1.5rem"
            lineHeight="1.375rem"
            fontWeight="500"
            color={COLORS.white}
          >
            {t('change_network')}
          </StyledText>
        </PrimaryButton>
      ) : (
        <PrimaryButton
          onClick={() => history.push('/robot-settings/update-robot')}
          width="100%"
        >
          <StyledText
            fontSize="1.5rem"
            lineHeight="1.375rem"
            fontWeight="500"
            color={COLORS.white}
          >
            {t('check_for_updates')}
          </StyledText>
        </PrimaryButton>
      )}
    </Flex>
  )
}
