import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { NetworkDetailsModal } from './NetworkDetailsModal'
import { DisplayWifiList } from '../../NetworkSettings'
import { getLocalRobot } from '/app/redux/discovery'
import { getNetworkInterfaces } from '/app/redux/networking'
import { useWifiList } from '/app/resources/networking/hooks'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

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
  const [showNetworkDetailModal, setShowNetworkDetailModal] = useState<boolean>(
    false
  )
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
      <Flex flexDirection={DIRECTION_COLUMN} marginTop="7.75rem">
        {activeSsid != null ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing40} ${SPACING.spacing40}`}
          >
            <LegacyStyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.grey60}
            >
              {t('connected_network')}
            </LegacyStyledText>
            <Btn
              display={DISPLAY_FLEX}
              width="100%"
              padding={SPACING.spacing24}
              backgroundColor={COLORS.green35}
              borderRadius={BORDERS.borderRadius12}
              onClick={() => {
                setShowNetworkDetailModal(true)
              }}
              alignItems={ALIGN_CENTER}
            >
              <Flex
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing24}
                width="100%"
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <Flex gridGap={SPACING.spacing8} width="34.8125rem">
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing16}>
                    <Icon
                      name="wifi"
                      size="2.5rem"
                      aria-label={`${activeSsid}_wifi_icon`}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing2}
                    >
                      <LegacyStyledText
                        as="h4"
                        textAlign={TYPOGRAPHY.textAlignLeft}
                      >
                        {activeSsid}
                      </LegacyStyledText>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex
                  alignItems={ALIGN_CENTER}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing10}
                >
                  <Icon
                    size="2.5rem"
                    name="info"
                    aria-label={`${activeSsid}_info_icon`}
                    color={COLORS.black90}
                  />
                  <LegacyStyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  >
                    {t('view_details')}
                  </LegacyStyledText>
                </Flex>
              </Flex>
            </Btn>
          </Flex>
        ) : null}
        {activeSsid != null ? (
          <LegacyStyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.grey60}
            paddingX={SPACING.spacing40}
            marginBottom={SPACING.spacing8}
          >
            {t('other_networks')}
          </LegacyStyledText>
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
