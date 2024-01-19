import type { UsbDevice, NetworkInterface } from '../types'

export const mockUsbDevice: UsbDevice = {
  // 0x0001
  vendorId: 1,
  // 0x000A
  productId: 10,
  productName: 'USB Device',
  manufacturerName: 'Manufacturer Name',
  serialNumber: 'Serial Number',
}

export const mockRealtekDevice: UsbDevice = {
  // 0x0BDA
  vendorId: 3034,
  // 0x8150
  productId: 33104,
  productName: 'USB 10/100 LAN',
  manufacturerName: 'Realtek',
  serialNumber: 'Serial Number',
}

export const mockWindowsRealtekDevice: UsbDevice = {
  // 0x0BDA
  vendorId: 3034,
  // 0x8150
  productId: 33104,
  productName: 'Realtek USB FE Family Controller',
  manufacturerName: 'Realtek',
  serialNumber: 'Serial Number',
  windowsDriverVersion: '1.2.3',
}

export const mockNetworkInterface: NetworkInterface = {
  name: 'en1',
  address: '192.168.1.2',
  netmask: '255.255.255.0',
  family: 'IPv4',
  mac: '88:e9:fe:74:69:60',
  internal: false,
  cidr: '192.168.1.2/24',
}

export const mockNetworkInterfaceV6: NetworkInterface = {
  name: 'en1',
  address: 'fe80::87f:5b2:cbc4:1638',
  netmask: 'ffff:ffff:ffff:ffff::',
  family: 'IPv6',
  mac: '88:e9:fe:74:69:60',
  internal: false,
  cidr: 'fe80::87f:5b2:cbc4:1638/64',
  scopeid: 7,
}
