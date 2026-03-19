import * as fsPromises from 'fs/promises'
import { join } from 'path'

import { createLogger } from '../log'

// ToDo (kk:2026/03/19) might need to remove items
interface UsbDevice {
  id: string
  product: string
  manufacturer?: string | null
  vendorId?: string | null
  productId?: string | null
  serialNumber: string | null
  location: string
  sysName: string
}

const USB_SYS_PATH = '/sys/bus/usb/devices'

const log = createLogger(new URL('', import.meta.url).pathname)

const readFileSafe = async (filePath: string): Promise<string | null> => {
  try {
    const value = await fsPromises.readFile(filePath, 'utf-8')
    return value.trim()
  } catch {
    return null
  }
}

// device nodes use names like `1-1` or `1-1.6`.
const isUsbDeviceDir = (name: string): boolean => /^\d+-[\d.]+$/.test(name)

const formatExternalLocation = (sysfsName: string): string => {
  const parts = sysfsName.split('-')
  if (parts.length < 2) return sysfsName
  return `USB-${parts[1]}`
}

const isInternalDevice = (
  vendorId: string | null,
  productId: string | null,
  product: string | null
): boolean => {
  // root hub
  if (vendorId === '1d6b' && productId === '0002') return true
  // usb hub
  if (vendorId === '1a40' && productId === '0201') return true
  // RearPanel
  if (vendorId === '04d8' && productId === 'ef01') return true
  // HD USB Camera
  if (vendorId === '32e4' && productId === '9230') return true

  // fallback
  // note not including "hub" in this fallback since users might use a USB hub
  if (product?.includes('RearPanel')) return true
  if (product?.includes('USB Camera')) return true

  return false
}

const getLocation = ({
  sysName,
  vendorId,
  productId,
  product,
}: {
  sysName: string
  vendorId: string | null
  productId: string | null
  product: string | null
}): string => {
  if (isInternalDevice(vendorId, productId, product)) {
    return 'INTERNAL'
  }

  return formatExternalLocation(sysName)
}

const readUsbDevice = async (sysName: string): Promise<UsbDevice | null> => {
  const dirPath = join(USB_SYS_PATH, sysName)

  const [product, manufacturer, vendorId, productId, serialNumber] =
    await Promise.all([
      readFileSafe(join(dirPath, 'product')),
      readFileSafe(join(dirPath, 'manufacturer')),
      readFileSafe(join(dirPath, 'idVendor')),
      readFileSafe(join(dirPath, 'idProduct')),
      readFileSafe(join(dirPath, 'serial')),
    ])

  // skip entries that do not look like USB devices
  if (product == null && vendorId == null && productId == null) {
    log.debug(`Skipping ${sysName}: no product or VID/PID found`)
    return null
  }

  return {
    id: sysName,
    sysName,
    product: product ?? 'Unknown device',
    manufacturer,
    vendorId,
    productId,
    serialNumber,
    location: getLocation({
      sysName,
      vendorId,
      productId,
      product,
    }),
  }
}

const compareUsbSysfsNames = (a: UsbDevice, b: UsbDevice): number => {
  return a.sysName.localeCompare(b.sysName, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export const getUsbDevices = async (): Promise<UsbDevice[]> => {
  log.info(`Reading USB devices from ${USB_SYS_PATH}`)

  try {
    const entries = await fsPromises.readdir(USB_SYS_PATH, {
      withFileTypes: true,
    })

    const devices = await Promise.all(
      entries
        .filter(
          entry =>
            (entry.isDirectory() || entry.isSymbolicLink()) &&
            isUsbDeviceDir(entry.name)
        )
        .map(entry => readUsbDevice(entry.name))
    )

    const result = devices
      .filter((device): device is UsbDevice => device != null)
      .sort(compareUsbSysfsNames)

    log.info(`Found ${result.length} USB devices`)
    log.debug(`USB devices: ${JSON.stringify(result)}`)

    return result
  } catch (error) {
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error)

    log.error(`Failed to read USB devices: ${message}`)
    return []
  }
}
