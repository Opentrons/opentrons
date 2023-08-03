import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { ChildNavigation } from '../../../organisms/ChildNavigation'
import {
  ConnectingNetwork,
  FailedToConnect,
} from '../../../organisms/NetworkSettings'
import { FAILURE, PENDING, SUCCESS } from '../../../redux/robot-api'

import type { SetSettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import type { RequestState } from '../../../redux/robot-api/types'

interface RobotSettingsWifiConnectProps {
  handleConnect: () => void
  requestState: RequestState | null
  selectedSsid: string
  setCurrentOption: SetSettingOption
}

/**
 * Robot settings page managing wifi connect status
 */
export function RobotSettingsWifiConnect({
  handleConnect,
  requestState,
  setCurrentOption,
  selectedSsid,
}: RobotSettingsWifiConnectProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')

  if (requestState == null) {
    // should only get here briefly if at all
    return null
  } else if (requestState.status === PENDING) {
    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        padding={SPACING.spacing40}
      >
        <ConnectingNetwork ssid={selectedSsid} />
      </Flex>
    )
  } else if (requestState.status === FAILURE) {
    const isInvalidPassword = requestState.response.status === 401
    return (
      <Flex flexDirection={DIRECTION_COLUMN} height="100%">
        <ChildNavigation
          header={t('wifi')}
          onClickBack={() => setCurrentOption('RobotSettingsWifi')}
        />
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing40}
          paddingTop={SPACING.spacing32}
        >
          <FailedToConnect
            requestState={requestState}
            selectedSsid={selectedSsid}
            isInvalidPassword={isInvalidPassword}
            handleTryAgain={() =>
              isInvalidPassword
                ? setCurrentOption('RobotSettingsSetWifiCred')
                : handleConnect()
            }
            handleChangeNetwork={() => setCurrentOption('RobotSettingsWifi')}
          />
        </Flex>
      </Flex>
    )
  } else if (requestState.status === SUCCESS) {
    setCurrentOption('RobotSettingsWifi')
    return null
  } else {
    return null
  }
}
