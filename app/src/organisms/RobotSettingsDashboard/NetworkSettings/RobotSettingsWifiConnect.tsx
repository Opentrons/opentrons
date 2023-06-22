import * as React from 'react'
import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
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
  if (requestState == null) {
    // TODO: do we ever get here?
    return null
  }

  const renderScreen = (): JSX.Element | null => {
    if (requestState.status === PENDING) {
      return <ConnectingNetwork ssid={selectedSsid} />
    } else if (requestState.status === FAILURE) {
      const isInvalidPassword = requestState.response.status === 401
      return (
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
      )
    } else if (requestState.status === SUCCESS) {
      setCurrentOption('RobotSettingsWifi')
      return null
    } else {
      // TODO: do we ever get here?
      return null
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
    >
      {renderScreen()}
    </Flex>
  )
}
