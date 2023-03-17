import assert from 'assert'
import execa from 'execa'
import { WebUSB } from 'usb'
import { isWindows } from '../os'
import { createLogger } from '../log'

export type UsbDeviceMonitorOptions = Partial<{
  onDeviceAdd?: (e: USBConnectionEvent) => void
  onDeviceRemove?: (e: USBConnectionEvent) => void
}>

export interface UsbDeviceMonitor {
  getAllDevices: () => Promise<USBDevice[]>
  stop: () => void
}

const log = createLogger('usb-devices')

export async function createUsbDeviceMonitor(
  options: UsbDeviceMonitorOptions = {}
): Promise<UsbDeviceMonitor> {
  const { onDeviceAdd, onDeviceRemove } = options

  // from usb package docs
  const customWebUSB = new WebUSB({
    // Bypass checking for authorized devices
    allowAllDevices: true,
  })

  if (typeof onDeviceAdd === 'function') {
    customWebUSB.addEventListener('connect', onDeviceAdd)
  }

  if (typeof onDeviceRemove === 'function') {
    customWebUSB.addEventListener('disconnect', onDeviceRemove)
  }

  return {
    getAllDevices: () => customWebUSB.getDevices(),
    stop: () => {
      if (typeof onDeviceAdd === 'function') {
        customWebUSB.removeEventListener('connect', onDeviceAdd)
      }
      if (typeof onDeviceRemove === 'function') {
        customWebUSB.removeEventListener('disconnect', onDeviceRemove)
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
