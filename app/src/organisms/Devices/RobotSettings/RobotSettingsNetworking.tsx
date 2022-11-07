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

import {
  fetchStatus,
  fetchWifiList,
  getNetworkInterfaces,
  getWifiList,
} from '../../../redux/networking'

import { useIsRobotBusy } from '../hooks'
import { SelectNetwork } from './SelectNetwork'

import type { State, Dispatch } from '../../../redux/types'
interface NetworkingProps {
  robotName: string
  updateRobotStatus: (isRobotBusy: boolean) => void
}

const HELP_CENTER_URL =
  'https://support.opentrons.com/s/article/Get-started-Connect-to-your-OT-2-over-USB'
const STATUS_REFRESH_MS = 5000
const LIST_REFRESH_MS = 10000

export function RobotSettingsNetworking({
  robotName,
  updateRobotStatus,
}: NetworkingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const list = useSelector((state: State) => getWifiList(state, robotName))
  const dispatch = useDispatch<Dispatch>()
  const isRobotBusy = useIsRobotBusy({ poll: true })

  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const activeNetwork = list?.find(nw => nw.active)

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)
  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    dispatch(fetchWifiList(robotName))
  }, [robotName, dispatch])

  React.useEffect(() => {
    updateRobotStatus(isRobotBusy)
  }, [isRobotBusy, updateRobotStatus])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex marginBottom={SPACING.spacing4}>
        {wifi?.ipAddress != null ? (
          <Icon
            size={SPACING.spacing4}
            name="ot-check"
            color={COLORS.successEnabled}
            marginRight={SPACING.spacing3}
            data-testid="RobotSettings_Networking_check_circle"
          />
        ) : (
          <Box height={SPACING.spacing4} width={SPACING.spacing5}></Box>
        )}
        <Icon
          size="1.25rem"
          name="wifi"
          marginRight={wifi?.ipAddress != null ? '0.5rem' : '0.75rem'}
          data-testid="RobotSettings_Networking_wifi_icon"
        />
        <StyledText as="h3">
          {t('wifi')}
          {activeNetwork?.ssid != null && ` - ${activeNetwork.ssid}`}
        </StyledText>
      </Flex>
      <Flex paddingLeft="3.5rem" marginBottom={SPACING.spacing3}>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('network_name')}
        </StyledText>
      </Flex>
      <Box paddingLeft="3.5rem" marginBottom={SPACING.spacing4}>
        {wifi?.ipAddress != null ? (
          <>
            <Flex marginBottom={SPACING.spacing5}>
              <Box width="25%" marginRight={SPACING.spacing3}>
                <SelectNetwork
                  robotName={robotName}
                  isRobotBusy={isRobotBusy}
                />
              </Box>
            </Flex>
            <Flex>
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
                  {t('wireless_subnet_mask')}
                </StyledText>
                <StyledText as="p">{wifi?.subnetMask}</StyledText>
              </Flex>

              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wireless_mac_address')}
                </StyledText>
                <StyledText as="p">{wifi?.macAddress}</StyledText>
              </Flex>
            </Flex>
          </>
        ) : (
          <Flex flexDirection={DIRECTION_COLUMN}>
            <SelectNetwork robotName={robotName} isRobotBusy={isRobotBusy} />
          </Flex>
        )}
      </Box>
      <Divider />
      <Flex marginTop={SPACING.spacing5} marginBottom={SPACING.spacing4}>
        {ethernet?.ipAddress != null ? (
          <Icon
            size={SPACING.spacing4}
            name="ot-check"
            color={COLORS.successEnabled}
            marginRight={SPACING.spacing3}
            data-testid="RobotSettings_Networking_check_circle"
          />
        ) : (
          <Box height={SPACING.spacing4} width={SPACING.spacing5}></Box>
        )}
        <Icon
          size="1.25rem"
          name="usb"
          marginRight="0.75rem"
          data-testid="RobotSettings_Networking_usb_icon"
        />
        <StyledText as="h3">{t('wired_usb')}</StyledText>
      </Flex>
      <Box paddingLeft="3.5rem">
        <Flex marginBottom={SPACING.spacing4}>
          {ethernet?.ipAddress != null ? (
            <>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wired_ip')}
                </StyledText>
                <StyledText as="p">{ethernet?.ipAddress}</StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wired_subnet_mask')}
                </StyledText>
                <StyledText as="p">{ethernet?.subnetMask}</StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingRight={SPACING.spacing4}
              >
                <StyledText css={TYPOGRAPHY.pSemiBold}>
                  {t('wired_mac_address')}
                </StyledText>
                <StyledText as="p">{ethernet?.macAddress}</StyledText>
              </Flex>
            </>
          ) : (
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {t('not_connected_via_wired_usb')}
            </StyledText>
          )}
        </Flex>

        <ExternalLink href={HELP_CENTER_URL} id="WiredUSB_description">
          {t('wired_usb_description')}
        </ExternalLink>
        <StyledText
          as="p"
          marginTop={SPACING.spacing4}
          marginBottom={SPACING.spacing3}
        >
          {t('usb_to_ethernet_description')}
        </StyledText>
        <Link to="/app-settings/advanced" css={TYPOGRAPHY.linkPSemiBold}>
          {t('go_to_advanced_settings')}
        </Link>
      </Box>
    </Flex>
  )
}
