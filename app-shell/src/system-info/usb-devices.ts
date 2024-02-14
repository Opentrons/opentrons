import assert from 'assert'
import execa from 'execa'
import { usb } from 'usb'
import { isWindows } from '../os'
import { createLogger } from '../log'
import { createHmac } from 'crypto'

import type { UsbDevice } from '@opentrons/app/src/redux/system-info/types'

export type UsbDeviceMonitorOptions = Partial<{
  onDeviceAdd?: (device: UsbDevice) => void
  onDeviceRemove?: (device: UsbDevice) => void
}>

export interface UsbDeviceMonitor {
  getAllDevices: () => Promise<UsbDevice[]>
  stop: () => void
}

const log = createLogger('usb-devices')

const decToHex = (number: number): string =>
  number.toString(16).toUpperCase().padStart(4, '0')
const idVendor = (device: usb.Device): string =>
  decToHex(device.deviceDescriptor.idVendor)
const idProduct = (device: usb.Device): string =>
  decToHex(device.deviceDescriptor.idProduct)

const descriptorToDevice = (
  descriptors: usb.Device,
  manufacturerName?: string,
  serialNumber?: string,
  productName?: string,
  systemIdentifier?: string
): UsbDevice => ({
  vendorId: descriptors.deviceDescriptor.idVendor,
  productId: descriptors.deviceDescriptor.idProduct,
  identifier: createHmac('md5', '')
    .update(decToHex(descriptors.busNumber))
    .update(decToHex(descriptors.deviceAddress))
    .digest('hex'),
  serialNumber,
  manufacturerName,
  productName,
  systemIdentifier,
})

const getStringDescriptorPromise = (
  device: usb.Device,
  index: number
): Promise<string> =>
  new Promise((resolve, reject) => {
    device.getStringDescriptor(index, (error?, value?) => {
      // fyi if you do something in this callback that throws there's a good chance
      // it will crash node. fyi things that might raise include calling half the
      // built-ins since this executes in a weird extension environment. for instance
      // log.info or in fact console.log will cause a hard crash here
      !!error || !!!value ? reject(error ?? 'no value') : resolve(value)
    })
  })

const orDefault = <T, U>(
  promise: Promise<T>,
  defaulter: (err: any) => U
): Promise<T | U> =>
  promise
    .then((result: T): T => result)
    .catch(
      (err: any) =>
        new Promise<U>(resolve => {
          resolve(defaulter(err))
        })
    )

const doUpstreamDeviceFromUsbDevice = (
  device: usb.Device
): Promise<UsbDevice[]> =>
  isWindows()
    ? upstreamDeviceFromUsbDeviceWinAPI(device)
    : upstreamDeviceFromUsbDeviceLibUSB(device)

function upstreamDeviceFromUsbDevice(device: usb.Device): Promise<UsbDevice[]> {
  return doUpstreamDeviceFromUsbDevice(device).catch(err => {
    log.error(
      `Failed to get device information for vid=${idVendor(
        device
      )} pid=${idProduct(device)}: ${err}: friendly names unavailable`
    )
    return [descriptorToDevice(device)]
  })
}

interface WmiObject {
  Present: boolean
  Manufacturer: string
  Name: string
  DeviceID: string
}

function upstreamDeviceFromUsbDeviceWinAPI(
  device: usb.Device
): Promise<UsbDevice[]> {
  // Here begins an annotated series of interesting powershell interactions!
  // We don't know the device ID of the device. For USB devices it's typically composed of
  // the VID, the PID, and the serial, and we don't know the serial. (Also if there's two devices
  // with the same vid+pid+serial, as with devices that hardcode serial to 1, then you get some
  // random something-or-other in there so even if we had the serial we couldn't rely on it.)

  // We also essentially have no way of linking this uniquely identifying information to that
  // provided by libusb. Libusb provides usb-oriented identifiers like the bus address; windows
  // provides identifiers about hubs and ports.

  // This is basically why we have everything returning lists of devices - this function needs
  // to tell people that it found multiple devices and it doesn't know which is which.

  // We can get a json-formatted dump of information about all devices with the specified vid and
  // pid
  return execa
    .command(
      `Get-WmiObject Win32_PnpEntity -Filter "DeviceId like '%\\VID_${idVendor(
        device
      )}&PID_${idProduct(
        device
      )}%'" | Select-Object -Property * | ConvertTo-JSON -Compress`,
      { shell: 'PowerShell.exe' }
    )
    .then(dump => {
      // powershell helpfully will dump a json object when there's exactly one result and a json
      // array when there's more than one result. isn't that really cool? this is actually fixed
      // in any at-all modern powershell version, where ConvertTo-JSON has a flag -AsArray that
      // forces array output, but you absolutely cannot rely on anything past like powershell
      // 5.1 being present
      const parsePoshJsonOutputToWmiObjectArray = (
        dump: string
      ): WmiObject[] => {
        if (dump[0] === '[') {
          return JSON.parse(dump) as WmiObject[]
        } else {
          return [JSON.parse(dump) as WmiObject]
        }
      }
      if (dump.stderr !== '') {
        return Promise.reject(new Error(`Command failed: ${dump.stderr}`))
      }
      const getObjsWithCorrectPresence = (wmiDump: WmiObject[]): WmiObject[] =>
        wmiDump.filter(obj => obj.Present)

      const objsToQuery = getObjsWithCorrectPresence(
        parsePoshJsonOutputToWmiObjectArray(dump.stdout.trim())
      )
      return objsToQuery.map(wmiObj =>
        descriptorToDevice(
          device,
          wmiObj.Manufacturer,
          // the serial number, or something kind of like a serial number in the case of devices
          // with duplicate serial numbers, is the third element of the device id which is formed
          // by concatenating stuff with \\ as a separator (and of course each \ must be escaped)
          wmiObj.DeviceID.match(/.*\\\\.*\\\\(.*)/)?.at(1) ?? undefined,
          wmiObj.Name,
          wmiObj.DeviceID
        )
      )
    })
}

function upstreamDeviceFromUsbDeviceLibUSB(
  device: usb.Device
): Promise<UsbDevice[]> {
  return new Promise<usb.Device>((resolve, reject) => {
    try {
      device.open(false)
    } catch (err: any) {
      log.error(
        `Failed to open vid=${idVendor(device)} pid=${idProduct(
          device
        )}: ${err}`
      )
      reject(err)
    }
    resolve(device)
  })
    .then(() =>
      Promise.all([
        orDefault(
          getStringDescriptorPromise(
            device,
            device.deviceDescriptor.iManufacturer
          ),
          (err: any): undefined => {
            log.error(
              `Failed to get manufacturer for vid=${idVendor(
                device
              )} pid=${idProduct(device)}: ${err}`
            )
            return undefined
          }
        ),
        orDefault(
          getStringDescriptorPromise(
            device,
            device.deviceDescriptor.iSerialNumber
          ),
          (err: any): undefined => {
            log.error(
              `Failed to get serial for vid=${idVendor(device)} pid=${idProduct(
                device
              )}: ${err}`
            )
            return undefined
          }
        ),
        orDefault(
          getStringDescriptorPromise(device, device.deviceDescriptor.iProduct),
          (err: any): undefined => {
            log.error(
              `Failed to get product name for vid=${idVendor(
                device
              )} pid=${idProduct(device)}: ${err}`
            )
            return undefined
          }
        ),
      ])
    )
    .then(([manufacturer, serialNumber, productName]) => {
      return [
        descriptorToDevice(device, manufacturer, serialNumber, productName),
      ]
    })
    .finally(() => {
      try {
        device.close()
      } catch (err) {
        log.warn(
          `Failed to close vid=${idVendor(device)}, pid=${idProduct(
            device
          )} in err handler: ${err}`
        )
      }
    })
}

export function createUsbDeviceMonitor(
  options: UsbDeviceMonitorOptions = {}
): UsbDeviceMonitor {
  const { onDeviceAdd, onDeviceRemove } = options
  if (isWindows()) {
    try {
      log.info('Initializing USBDk backend on windows')
      usb.useUsbDkBackend()
      log.info('USBDk backend initialized')
    } catch (err) {
      log.error(`Could not initialize USBDk backend: ${err}`)
    }
  }
  if (typeof onDeviceAdd === 'function') {
    usb.on('attach', device => {
      upstreamDeviceFromUsbDevice(device).then(devices =>
        devices.forEach(onDeviceAdd)
      )
    })
  }

  if (typeof onDeviceRemove === 'function') {
    usb.on('detach', device => {
      onDeviceRemove(descriptorToDevice(device))
    })
  }

  return {
    getAllDevices: () =>
      new Promise<usb.Device[]>((resolve, reject) => {
        resolve(usb.getDeviceList())
      })
        .then(deviceList =>
          Promise.all(deviceList.map(upstreamDeviceFromUsbDevice))
        )
        .then(upstreamDevices => upstreamDevices.flat()),
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

const deviceIdFromDetails = (device: UsbDevice): string | null => {
  const {
    vendorId: vidDecimal,
    productId: pidDecimal,
    serialNumber,
    systemIdentifier,
  } = device
  if (systemIdentifier !== undefined) {
    return systemIdentifier
  }
  const [vid, pid] = [decToHex(vidDecimal), decToHex(pidDecimal)]

  // USBDevice serialNumber is  string | undefined
  if (serialNumber == null) {
    return null
  }
  return `USB\\VID_${vid}&PID_${pid}\\${serialNumber}`
}

export function getWindowsDriverVersion(
  device: UsbDevice
): Promise<string | null> {
  console.log('getWindowsDriverVersion', device)
  assert(
    isWindows() || process.env.NODE_ENV === 'test',
    `getWindowsDriverVersion cannot be called on ${process.platform}`
  )

  const deviceId = deviceIdFromDetails(device)

  return execa
    .command(
      `Get-PnpDeviceProperty -InstanceID "${deviceId}" -KeyName "DEVPKEY_Device_DriverVersion" | % { $_.Data }`,
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
