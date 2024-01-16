import assert from 'assert'
import execa from 'execa'
import { usb, webusb } from 'usb'
import { isWindows } from '../os'
import { createLogger } from '../log'

export type UsbDeviceMonitorOptions = Partial<{
  onDeviceAdd?: (device: USBDevice) => unknown
  onDeviceRemove?: (device: USBDevice) => unknown
}>

export interface UsbDeviceMonitor {
  getAllDevices: () => Promise<USBDevice[]>
  stop: () => void
}

const log = createLogger('usb-devices')

export function createUsbDeviceMonitor(
  options: UsbDeviceMonitorOptions = {}
): UsbDeviceMonitor {
  const { onDeviceAdd, onDeviceRemove } = options

  if (typeof onDeviceAdd === 'function') {
    usb.on('attach', device => onDeviceAdd)
  }

  if (typeof onDeviceRemove === 'function') {
    usb.on('detach', device => onDeviceRemove)
  }

  return {
    getAllDevices: () => Promise.resolve(webusb.getDevices()),
    stop: () => {
      if (typeof onDeviceAdd === 'function') {
        usb.removeAllListeners('attach')
      }
      if (typeof onDeviceRemove === 'function') {
        usb.removeAllListeners('detach')
      }

      log.debug('usb detection monitoring stopped')
    },
  }
}

const decToHex = (number: number): string =>
  number.toString(16).toUpperCase().padStart(4, '0')

export function getWindowsDriverVersion(
  device: USBDevice
): Promise<string | null> {
  const { vendorId: vidDecimal, productId: pidDecimal, serialNumber } = device
  const [vid, pid] = [decToHex(vidDecimal), decToHex(pidDecimal)]

  // USBDevice serialNumber is  string | undefined
  if (serialNumber == null) {
    return Promise.resolve(null)
  }

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
