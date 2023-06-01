import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

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

import { StyledText } from '../../../../atoms/text'
import { NetworkDetailsModal } from './NetworkDetailsModal'
import { getLocalRobot } from '../../../../redux/discovery'
import { fetchStatus, getNetworkInterfaces } from '../../../../redux/networking'

import type { Dispatch, State } from '../../../../redux/types'

interface WifiConnectionDetailsProps {
  ssid?: string
  authType?: string
}
export function WifiConnectionDetails({
  ssid,
  authType,
}: WifiConnectionDetailsProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const [
    showNetworkDetailModal,
    setShowNetworkDetailModal,
  ] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const noData = i18n.format(t('shared:no_data'), 'titleCase')
  const ipAddress = wifi?.ipAddress != null ? wifi.ipAddress : noData
  const subnetMask = wifi?.subnetMask != null ? wifi.subnetMask : noData
  const macAddress = wifi?.macAddress != null ? wifi.macAddress : noData

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

  return (
    <>
      {showNetworkDetailModal ? (
        <NetworkDetailsModal
          ssid={ssid}
          setShowNetworkDetailModal={setShowNetworkDetailModal}
          ipAddress={ipAddress}
          subnetMask={subnetMask}
          macAddress={macAddress}
          securityType={authType}
        />
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN} paddingX={SPACING.spacing40}>
        {ssid != null ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            marginBottom={SPACING.spacing40}
          >
            <StyledText
              fontSize={TYPOGRAPHY.fontSize22}
              lineHeight={TYPOGRAPHY.lineHeight28}
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
                      aria-label={`${ssid}_wifi_icon`}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing2}
                    >
                      <StyledText
                        fontSize={TYPOGRAPHY.fontSize28}
                        lineHeight={TYPOGRAPHY.lineHeight36}
                        fontWeight={TYPOGRAPHY.fontWeightRegular}
                        textAlign={TYPOGRAPHY.textAlignLeft}
                      >
                        {ssid}
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
                    aria-label={`${ssid}_info_icon`}
                  />
                  <StyledText
                    fontSize={TYPOGRAPHY.fontSize22}
                    lineHeight={TYPOGRAPHY.lineHeight28}
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
        {ssid != null ? (
          <StyledText
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.darkBlack70}
          >
            {t('other_networks')}
          </StyledText>
        ) : null}
        {/* ToDo (kj:04/26/2023) this will be added // wifi list */}
      </Flex>
    </>
  )
}
