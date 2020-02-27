// @flow

// TODO: (isk: 2/27/20): Move next to selectors
import { CONNECTABLE } from '../../../../discovery'
import { NO_SECURITY, WPA_EAP_SECURITY } from '../../../../http-api-client'

import type { ViewableRobot } from '../../../../discovery/types'
import type { WifiNetwork } from '../../../../networking/types'

export const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

export const wifiList: Array<WifiNetwork> = [
  {
    ssid: 'Test',
    signal: 100,
    active: true,
    security: 'WPA2',
    securityType: WPA_EAP_SECURITY,
  },
  {
    ssid: 'No Security',
    signal: 100,
    active: false,
    security: 'none',
    securityType: NO_SECURITY,
  },
  {
    ssid: 'Opentrons',
    signal: 100,
    active: false,
    security: 'WPA2',
    securityType: WPA_EAP_SECURITY,
  },
]

export const mockState = {
  networking: {
    'robot-name': {
      wifiList,
    },
  },
  superDeprecatedRobotApi: {
    api: { 'robot-name': {} },
  },
  robotApi: {},
}
