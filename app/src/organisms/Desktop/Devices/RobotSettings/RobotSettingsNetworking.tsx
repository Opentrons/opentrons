import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SecondaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useInterval,
} from '@opentrons/components'

import { useCanDisconnect, useWifiList } from '/app/resources/networking/hooks'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { Divider } from '/app/atoms/structure'

import {
  getRobotAddressesByName,
  HEALTH_STATUS_OK,
  OPENTRONS_USB,
} from '/app/redux/discovery'
import { fetchStatus, getNetworkInterfaces } from '/app/redux/networking'
import { useIsFlex, useIsRobotBusy } from '/app/redux-resources/robots'
import { DisconnectModal } from './ConnectNetwork/DisconnectModal'
import { SelectNetwork } from './SelectNetwork'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

import type { State, Dispatch } from '/app/redux/types'
import { getModalPortalEl } from '/app/App/portal'
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
  const wifiList = useWifiList(robotName, LIST_REFRESH_MS)
  const dispatch = useDispatch<Dispatch>()
  const isRobotBusy = useIsRobotBusy({ poll: true })
  const isFlex = useIsFlex(robotName)

  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false)

  const canDisconnect = useCanDisconnect(robotName)

  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const activeNetwork = wifiList?.find(network => network.active)

  const ssid = activeNetwork?.ssid ?? null

  const addresses = useSelector((state: State) =>
    getRobotAddressesByName(state, robotName)
  )
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const wifiAddress = addresses.find(addr => addr.ip === wifi?.ipAddress)
  const isFlexConnectedViaWifi =
    wifiAddress != null && wifiAddress.healthStatus === HEALTH_STATUS_OK

  const ethernetAddress = addresses.find(
    addr => addr.ip === ethernet?.ipAddress
  )
  const isFlexConnectedViaEthernet =
    ethernetAddress != null && ethernetAddress.healthStatus === HEALTH_STATUS_OK

  const usbAddress = addresses.find(addr => addr.ip === OPENTRONS_USB)
  const isFlexConnectedViaUSB =
    usbAddress != null && usbAddress.healthStatus === HEALTH_STATUS_OK

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)

  useEffect(() => {
    updateRobotStatus(isRobotBusy)
  }, [isRobotBusy, updateRobotStatus])

  return (
    <>
      {showDisconnectModal
        ? createPortal(
            <DisconnectModal
              onCancel={() => {
                setShowDisconnectModal(false)
              }}
              robotName={robotName}
            />,
            getModalPortalEl()
          )
        : null}
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <Flex alignItems={ALIGN_CENTER}>
          {isFlexConnectedViaWifi ? (
            <Icon
              size="1.25rem"
              name="ot-check"
              color={COLORS.green50}
              marginRight={SPACING.spacing8}
              data-testid="RobotSettings_Networking_check_circle"
            />
          ) : (
            <Box height={SPACING.spacing16} width="1.75rem"></Box>
          )}
          <Icon
            size="1.25rem"
            name="wifi"
            marginRight={
              wifi?.ipAddress != null ? SPACING.spacing8 : SPACING.spacing12
            }
            data-testid="RobotSettings_Networking_wifi_icon"
          />
          <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('wifi')}
            {ssid != null && ` - ${ssid}`}
          </LegacyStyledText>
        </Flex>
        <Box paddingLeft="3.75rem">
          {wifi?.ipAddress != null ? (
            <>
              <Flex marginBottom={SPACING.spacing24}>
                <Flex marginRight={SPACING.spacing8}>
                  <SelectNetwork
                    robotName={robotName}
                    isRobotBusy={isRobotBusy || isEstopNotDisengaged}
                  />
                </Flex>
                {canDisconnect && !isRobotBusy ? (
                  <SecondaryButton
                    onClick={() => {
                      setShowDisconnectModal(true)
                    }}
                    disabled={isEstopNotDisengaged}
                  >
                    {t('disconnect_from_wifi')}
                  </SecondaryButton>
                ) : null}
              </Flex>
              <Flex gridGap={SPACING.spacing16}>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wireless_ip')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {wifi?.ipAddress}
                  </LegacyStyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wireless_subnet_mask')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {wifi?.subnetMask}
                  </LegacyStyledText>
                </Flex>

                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wireless_mac_address')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {wifi?.macAddress}
                  </LegacyStyledText>
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
        <Flex alignItems={ALIGN_CENTER}>
          {isFlexConnectedViaEthernet ? (
            <Icon
              size="1.25rem"
              name="ot-check"
              color={COLORS.green50}
              marginRight={SPACING.spacing8}
              data-testid="RobotSettings_Networking_check_circle"
            />
          ) : (
            <Box height={SPACING.spacing16} width="1.75rem"></Box>
          )}
          <Icon
            size="1.25rem"
            name={isFlex ? 'ethernet' : 'usb'}
            marginRight={SPACING.spacing12}
            data-testid="RobotSettings_Networking_usb_icon"
          />
          <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {isFlex ? t('ethernet') : t('wired_usb')}
          </LegacyStyledText>
        </Flex>
        <Box paddingLeft="3.75rem">
          <Flex gridGap={SPACING.spacing16}>
            {ethernet?.ipAddress != null ? (
              <>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wired_ip')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {ethernet?.ipAddress}
                  </LegacyStyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wired_subnet_mask')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {ethernet?.subnetMask}
                  </LegacyStyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
                    {t('wired_mac_address')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p" color={COLORS.grey50}>
                    {ethernet?.macAddress}
                  </LegacyStyledText>
                </Flex>
              </>
            ) : (
              <LegacyStyledText as="p" color={COLORS.grey50}>
                {isFlex
                  ? t('not_connected_via_ethernet')
                  : t('not_connected_via_wired_usb')}
              </LegacyStyledText>
            )}
          </Flex>
          {isFlex ? null : (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginTop={SPACING.spacing16}
            >
              <ExternalLink href={HELP_CENTER_URL} id="WiredUSB_description">
                {t('wired_usb_description')}
              </ExternalLink>
              <LegacyStyledText
                as="p"
                marginTop={SPACING.spacing16}
                marginBottom={SPACING.spacing8}
              >
                {t('usb_to_ethernet_description')}
              </LegacyStyledText>
              <Link to="/app-settings/advanced" css={TYPOGRAPHY.linkPSemiBold}>
                {t('go_to_advanced_settings')}
              </Link>
            </Flex>
          )}
        </Box>
        {isFlex ? (
          <>
            <Divider />
            <Flex alignItems={ALIGN_CENTER}>
              {isFlexConnectedViaUSB ? (
                <Icon
                  size="1.25rem"
                  name="ot-check"
                  color={COLORS.green50}
                  marginRight={SPACING.spacing8}
                  data-testid="RobotSettings_Networking_check_circle"
                />
              ) : (
                <Box height={SPACING.spacing16} width="1.75rem"></Box>
              )}
              <Icon
                size="1.25rem"
                name="usb"
                marginRight={SPACING.spacing12}
                data-testid="RobotSettings_Networking_wifi_icon"
              />
              <LegacyStyledText
                as="h3"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('usb')}
              </LegacyStyledText>
            </Flex>
            <Box paddingLeft="3.75rem">
              <LegacyStyledText as="p" color={COLORS.grey50}>
                {isFlexConnectedViaUSB
                  ? t('directly_connected_to_this_computer')
                  : t('not_connected_via_usb')}
              </LegacyStyledText>
            </Box>
          </>
        ) : null}
      </Flex>
    </>
  )
}
