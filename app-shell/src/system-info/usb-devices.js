// @flow
import assert from 'assert'
import execa from 'execa'
import usbDetection from 'usb-detection'
import { isWindows } from '../os'
import { createLogger } from '../log'

import type { Device } from 'usb-detection'

export type { Device }

export type UsbDeviceMonitorOptions = $Shape<{|
  onDeviceAdd?: (device: Device) => mixed,
  onDeviceRemove?: (device: Device) => mixed,
|}>

export type UsbDeviceMonitor = {|
  getAllDevices: () => Promise<Array<Device>>,
  stop: () => void,
|}

const logger = createLogger('usb-devices')

export function createUsbDeviceMonitor(
  options: UsbDeviceMonitorOptions = {}
): UsbDeviceMonitor {
  usbDetection.startMonitoring()

  if (typeof options.onDeviceAdd === 'function') {
    usbDetection.on('add', options.onDeviceAdd)
  }

  if (typeof options.onDeviceRemove === 'function') {
    usbDetection.on('remove', options.onDeviceRemove)
  }

  return {
    getAllDevices: () => usbDetection.find(),
    stop: () => usbDetection.stopMonitoring(),
  }
}

const decToHex = (number: number) =>
  number
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')

export function getWindowsDriverVersion(
  device: Device
): Promise<string | null> {
  const { vendorId: vidDecimal, productId: pidDecimal, serialNumber } = device
  const [vid, pid] = [decToHex(vidDecimal), decToHex(pidDecimal)]

  assert(
    isWindows() || process.env.NODE_ENV === 'test',
    `getWindowsDriverVersion cannot be called on ${process.platform}`
  )

  return execa
    .command(
      `Get-PnpDeviceProperty -InstanceID "USB\\VID_${vid}&PID_${pid}\\${serialNumber}" -KeyName "DEVPKEY_Device_DriverVersion" | % { $_.Data }`,
      { shell: 'PowerShell.exe' }
    )
    .catch(error => {
      logger.warn('unable to read Windows USB driver version', {
        device,
        error,
      })
      return null
    })
}
