import type { InterfaceStatus, NetworkingStatusResponse } from '../types'

export const mockWifiInterface: InterfaceStatus = {
  ipAddress: '192.168.43.97/24',
  macAddress: 'B8:27:EB:6C:95:CF',
  gatewayAddress: '192.168.43.161',
  state: 'connected',
  type: 'wifi',
}

export const mockEthernetInterface: InterfaceStatus = {
  ipAddress: '169.254.229.173/16',
  macAddress: 'B8:27:EB:39:C0:9A',
  gatewayAddress: null,
  state: 'connected',
  type: 'ethernet',
}

export const mockNetworkingStatus: NetworkingStatusResponse = {
  status: 'full',
  interfaces: {
    wlan0: mockWifiInterface,
    eth0: mockEthernetInterface,
  },
}
