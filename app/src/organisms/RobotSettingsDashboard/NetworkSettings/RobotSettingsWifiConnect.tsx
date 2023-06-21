import * as React from 'react'

import {
  ConnectingNetwork,
  FailedToConnect,
} from '../../../organisms/NetworkSettings'
import { FAILURE, PENDING, SUCCESS } from '../../../redux/robot-api'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { SetSettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import type { RequestState } from '../../../redux/robot-api/types'

const STATUS_CODE_UNAUTHORIZED = 401

interface RobotSettingsWifiConnectProps {
  handleConnect: () => void
  requestState: RequestState | null
  selectedSsid: string
  setCurrentOption: SetSettingOption
  selectedAuthType: WifiSecurityType
}

/**
 * Robot settings page managing wifi connect status
 */
export function RobotSettingsWifiConnect({
  handleConnect,
  requestState,
  setCurrentOption,
  selectedSsid,
  selectedAuthType,
}: RobotSettingsWifiConnectProps): JSX.Element | null {
  console.log({ requestState })
  if (requestState == null) {
    // TODO: do we ever get here?
    return null
  } else if (requestState.status === PENDING) {
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
