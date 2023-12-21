import assert from 'assert'
import execa from 'execa'
// import usbDetection from 'usb-detection'
import { usb } from 'usb'
import { isWindows } from '../os'
import { createLogger } from '../log'

// import type { Device } from 'usb-detection'
import type { Device } from 'usb'

export type { Device }

export type UsbDeviceMonitorOptions = Partial<{
  onDeviceAdd?: (device: Device) => unknown
  onDeviceRemove?: (device: Device) => unknown
}>

export interface UsbDeviceMonitor {
  // getAllDevices: () => Promise<Device[]>
  getAllDevices: () => Device[]
  stop: () => void
}

const log = createLogger('usb-devices')

export function createUsbDeviceMonitor(
  options: UsbDeviceMonitorOptions = {}
): UsbDeviceMonitor {
  const { onDeviceAdd, onDeviceRemove } = options
  // usbDetection.startMonitoring()

  if (typeof onDeviceAdd === 'function') {
    usb.on('attach', onDeviceAdd)
  }

  if (typeof onDeviceRemove === 'function') {
    usb.on('detach', onDeviceRemove)
  }

  return {
    // getAllDevices: () => usbDetection.find(),
    getAllDevices: () => usb.getDeviceList(),
    stop: () => {
      if (typeof onDeviceAdd === 'function') {
        usb.off('attach', onDeviceAdd)
      }
      if (typeof onDeviceRemove === 'function') {
        usb.off('detach', onDeviceRemove)
      }

      // usbDetection.stopMonitoring()
      log.debug('usb detection monitoring stopped')
    },
  }
}

const decToHex = (number: number): string =>
  number.toString(16).toUpperCase().padStart(4, '0')

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
    .then(result => result.stdout.trim())
    .catch(error => {
      log.warn('unable to read Windows USB driver version', {
        device,
        error,
      })
      return null
    })
}
