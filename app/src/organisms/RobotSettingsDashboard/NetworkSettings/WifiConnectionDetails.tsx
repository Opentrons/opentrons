import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Icon,
  Btn,
  BORDERS,
  ALIGN_CENTER,
  DISPLAY_FLEX,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { NetworkDetailsModal } from './NetworkDetailsModal'
import { DisplayWifiList } from '../../NetworkSettings'
import { getLocalRobot } from '../../../redux/discovery'
import { getNetworkInterfaces } from '../../../redux/networking'
import { useWifiList } from '../../../resources/networking/hooks'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '../../../redux/types'

const FETCH_WIFI_LIST_MS = 5000

interface WifiConnectionDetailsProps {
  handleJoinAnotherNetwork: () => void
  handleNetworkPress: (ssid: string) => void
  activeSsid?: string
  connectedWifiAuthType?: WifiSecurityType
}
export function WifiConnectionDetails({
  activeSsid,
  connectedWifiAuthType,
  handleNetworkPress,
  handleJoinAnotherNetwork,
}: WifiConnectionDetailsProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const [
    showNetworkDetailModal,
    setShowNetworkDetailModal,
  ] = React.useState<boolean>(false)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const list = useWifiList(robotName, FETCH_WIFI_LIST_MS)
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const noData = i18n.format(t('shared:no_data'), 'titleCase')
  const ipAddress = wifi?.ipAddress != null ? wifi.ipAddress : noData
  const subnetMask = wifi?.subnetMask != null ? wifi.subnetMask : noData
  const macAddress = wifi?.macAddress != null ? wifi.macAddress : noData

  return (
    <>
      {showNetworkDetailModal ? (
        <NetworkDetailsModal
          ssid={activeSsid}
          setShowNetworkDetailModal={setShowNetworkDetailModal}
          ipAddress={ipAddress}
          subnetMask={subnetMask}
          macAddress={macAddress}
          securityType={connectedWifiAuthType}
        />
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        {activeSsid != null ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing40} ${SPACING.spacing40}`}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack70}
            >
              {t('connected_network')}
            </StyledText>
            <Btn
              display={DISPLAY_FLEX}
              width="100%"
              padding={SPACING.spacing24}
              backgroundColor={COLORS.green3}
              borderRadius={BORDERS.borderRadiusSize3}
              onClick={() => setShowNetworkDetailModal(true)}
              alignItems={ALIGN_CENTER}
            >
              <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
                <Flex gridGap={SPACING.spacing8} width="34.8125rem">
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
                    <Icon
                      name="wifi"
                      size="2.5rem"
                      aria-label={`${activeSsid}_wifi_icon`}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing2}
                    >
                      <StyledText as="h4" textAlign={TYPOGRAPHY.textAlignLeft}>
                        {activeSsid}
                      </StyledText>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex
                  alignItems={ALIGN_CENTER}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing12}
                >
                  <Icon
                    size="2.5rem"
                    name="info"
                    aria-label={`${activeSsid}_info_icon`}
                  />
                  <StyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    color={COLORS.darkBlack70}
                  >
                    {t('view_details')}
                  </StyledText>
                </Flex>
              </Flex>
            </Btn>
          </Flex>
        ) : null}
        {activeSsid != null ? (
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.darkBlack70}
            paddingX={SPACING.spacing40}
          >
            {t('other_networks')}
          </StyledText>
        ) : null}
        <DisplayWifiList
          list={list}
          handleJoinAnotherNetwork={handleJoinAnotherNetwork}
          handleNetworkPress={(ssid: string) => {
            handleNetworkPress(ssid)
          }}
        />
      </Flex>
    </>
  )
}
