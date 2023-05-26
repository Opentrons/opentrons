import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  Icon,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { MediumButton } from '../../../atoms/buttons'
import { getLocalRobot } from '../../../redux/discovery'
import { getNetworkInterfaces } from '../../../redux/networking'
import { NetworkDetailsModal } from '../RobotSettingsDashboard/NetworkSettings/NetworkDetailsModal'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { State } from '../../../redux/types'

interface WifiConnectionDetailsProps {
  ssid?: string
  authType?: WifiSecurityType
  showHeader?: boolean
}

export function WifiConnectionDetails({
  ssid,
  authType,
}: WifiConnectionDetailsProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  const noData = i18n.format(t('shared:no_data'), 'titleCase')
  const ipAddress = wifi?.ipAddress != null ? wifi.ipAddress : noData
  const subnetMask = wifi?.subnetMask != null ? wifi.subnetMask : noData
  const macAddress = wifi?.macAddress != null ? wifi.macAddress : noData

  const [
    showNetworkDetailsModal,
    setShowNetworkDetailsModal,
  ] = React.useState<boolean>(false)

  return (
    <>
      {showNetworkDetailsModal ? (
        <NetworkDetailsModal
          ssid={ssid}
          setShowNetworkDetailModal={setShowNetworkDetailsModal}
          ipAddress={ipAddress}
          subnetMask={subnetMask}
          macAddress={macAddress}
          securityType={authType}
        />
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <TitleHeader />
        <DisplayConnectionStatus ssid={ssid} />
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <MediumButton
            flex="1"
            buttonType="secondary"
            buttonText={t('view_network_details')}
            onClick={() => setShowNetworkDetailsModal(true)}
          />
          <MediumButton
            flex="1"
            buttonText={i18n.format(t('continue'), 'capitalize')}
            onClick={() => history.push('/robot-settings/update-robot')}
          />
        </Flex>
      </Flex>
    </>
  )
}

const TitleHeader = (): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing32}
    >
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {t('wifi')}
      </StyledText>
    </Flex>
  )
}

interface DisplayConnectionStatusProps {
  ssid?: string
}

const DisplayConnectionStatus = ({
  ssid,
}: DisplayConnectionStatusProps): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing32}
      padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
      backgroundColor={COLORS.green3}
      borderRadius={BORDERS.size3}
      height="18.5rem"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Icon size="3rem" name="ot-check" color={COLORS.green2} />
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('successfully_connected_to_network', { ssid })}
      </StyledText>
    </Flex>
  )
}
