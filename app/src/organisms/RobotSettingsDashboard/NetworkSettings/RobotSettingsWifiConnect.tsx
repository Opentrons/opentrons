import * as React from 'react'

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
  } else if (requestState.status === PENDING) {
    return <ConnectingNetwork ssid={selectedSsid} />
  } else if (requestState.status === FAILURE) {
    return (
      <FailedToConnect
        handleConnect={handleConnect}
        requestState={requestState}
        setCurrentOption={setCurrentOption}
        selectedSsid={selectedSsid}
      />
    )
  } else if (requestState.status === SUCCESS) {
    setCurrentOption('RobotSettingsWifi')
    // TODO: do we need a success screen?
    return null
  } else {
    // TODO: do we ever get here?
    return null
  }
}
