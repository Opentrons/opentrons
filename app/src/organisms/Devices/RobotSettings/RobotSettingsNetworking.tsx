import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  Flex,
  DIRECTION_COLUMN,
  Box,
  COLORS,
  Icon,
  SPACING,
  TYPOGRAPHY,
  useInterval,
} from '@opentrons/components'
import { ExternalLink } from '../../../atoms/Link/ExternalLink'
import { StyledText } from '../../../atoms/text'
import { Divider } from '../../../atoms/structure'
import { SecondaryButton } from '../../../atoms/Buttons'
import {
  fetchStatus,
  fetchWifiList,
  getNetworkInterfaces,
  getWifiList,
  postWifiDisconnect,
} from '../../../redux/networking'
import * as RobotApi from '../../../redux/robot-api'
import { TemporarySelectNetwork } from './TemporarySelectNetwork'

import type { State, Dispatch } from '../../../redux/types'
interface NetworkingProps {
  robotName: string
}

// ToDo modify ConnectModal to align with new design
// This is temporary until we can get the new design details
const HELP_CENTER_URL =
  'https://support.opentrons.com/en/articles/2687586-get-started-connect-to-your-ot-2-over-usb'
const STATUS_REFRESH_MS = 5000
const LIST_REFRESH_MS = 10000

export function RobotSettingsNetworking({
  robotName,
}: NetworkingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const list = useSelector((state: State) => getWifiList(state, robotName))
  const dispatch = useDispatch<Dispatch>()
  const [dispatchApi] = RobotApi.useDispatchApiRequest()

  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const activeNetwork = list?.find(nw => nw.active)

  const handleDisconnect = (): void => {
    if (activeNetwork != null) {
      const ssid = activeNetwork.ssid
      dispatchApi(postWifiDisconnect(robotName, activeNetwork.ssid))
      console.log(`disconnected from ${ssid}`)
    }
  }

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)
  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    dispatch(fetchWifiList(robotName))
  }, [robotName, dispatch])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex marginBottom={SPACING.spacing4}>
        {wifi != null && wifi.ipAddress != null ? (
          <Icon
            width={SPACING.spacing4}
            name="check-circle"
            color={COLORS.success}
            marginRight={SPACING.spacing3}
          ></Icon>
        ) : (
          <Box height={SPACING.spacing4} width={SPACING.spacing4}></Box>
        )}
        <Icon
          width={SPACING.spacing4}
          name="ot-wifi-3"
          marginRight={SPACING.spacing3}
        ></Icon>
        <StyledText as="h3">
          {t('wireless_network')}
          {activeNetwork?.ssid && ` - ${activeNetwork.ssid}`}
        </StyledText>
      </Flex>
      <Box paddingLeft={SPACING.spacing7} marginBottom={SPACING.spacing4}>
        {wifi != null && wifi.ipAddress != null ? (
          <>
            <Flex>
              <Box width="25%" marginRight={SPACING.spacing3}>
                <TemporarySelectNetwork robotName={robotName} />
              </Box>
              <SecondaryButton onClick={handleDisconnect}>
                {t('wireless_network_disconnect_button')}
              </SecondaryButton>
            </Flex>
            <Flex marginTop={SPACING.spacing4} marginBottom={SPACING.spacing4}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wireless_ip')}
                </StyledText>
                <StyledText as="p">{wifi?.ipAddress}</StyledText>
              </Flex>

              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wireless_subnet')}
                </StyledText>
                <StyledText as="p">{wifi?.subnetMask}</StyledText>
              </Flex>

              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wireless_mac')}
                </StyledText>
                <StyledText as="p">{wifi?.macAddress}</StyledText>
              </Flex>
            </Flex>
          </>
        ) : (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('wireless_network_not_connected')}
            </StyledText>
            <TemporarySelectNetwork robotName={robotName} />
          </Flex>
        )}
      </Box>
      <Divider />
      <Flex marginBottom={SPACING.spacing4}>
        {ethernet !== null && ethernet.ipAddress !== null ? (
          <Icon
            width={SPACING.spacing4}
            name="check-circle"
            color={COLORS.success}
            marginRight={SPACING.spacing3}
          ></Icon>
        ) : (
          <Box height={SPACING.spacing4} width={SPACING.spacing4}></Box>
        )}
        <Icon
          width={SPACING.spacing4}
          name="usb"
          marginRight={SPACING.spacing4}
        ></Icon>
        <StyledText as="h3">{t('wired_usb')}</StyledText>
      </Flex>
      <Box paddingLeft="3.5rem">
        <Flex>
          {ethernet !== null && ethernet.ipAddress !== null ? (
            <>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText as="p">{t('wired_ip')}</StyledText>
                <StyledText as="p">{ethernet?.ipAddress}</StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText as="p">{t('wired_subnet')}</StyledText>
                <StyledText as="p">{ethernet?.subnetMask}</StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText as="p">{t('wired_mac')}</StyledText>
                <StyledText as="p">{ethernet?.macAddress}</StyledText>
              </Flex>
            </>
          ) : (
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('wired_usb_not_connected_description')}
            </StyledText>
          )}
        </Flex>

        <ExternalLink
          css={TYPOGRAPHY.pSemiBold}
          href={HELP_CENTER_URL}
          id="WiredUSB_description"
          marginBottom={SPACING.spacing4}
        >
          {t('wired_usb_description')}
        </ExternalLink>
        <StyledText as="p" paddingBottom={SPACING.spacing3}>
          {t('usb_to_ethernet_description')}
        </StyledText>
        <Link to="/app-settings/advanced">
          <StyledText css={TYPOGRAPHY.pSemiBold} color={COLORS.blue}>
            {t('go_to_advanced_settings')}
          </StyledText>
        </Link>
      </Box>
    </Flex>
  )
}
