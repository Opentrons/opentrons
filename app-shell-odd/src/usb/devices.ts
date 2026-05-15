import * as fsPromises from 'fs/promises'
import { join } from 'path'

import { createLogger } from '../log'

import type { AppShellUsbDevice } from './types'

const USB_SYS_PATH = '/sys/bus/usb/devices'
const log = createLogger(new URL('', import.meta.url).pathname)
const USB_PORT_LOCATIONS = [
  ['1.4.4', 'USB-1'],
  ['1.4.3', 'USB-2'],
  ['1.4.2', 'USB-3'],
  ['1.4.1', 'USB-4'],
  ['1.3.4', 'USB-5'],
  ['1.3.3', 'USB-6'],
  ['1.3.2', 'USB-7'],
  ['1.3.1', 'USB-8'],
  ['1.7', 'FRONTPORT'],
] as const

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

const getUsbPortPath = (sysfsName: string): string | null => {
  const parts = sysfsName.split('-')
  return parts.length < 2 ? null : parts[1]
}

// Map sysName port to the labels on Flex
const formatExternalLocation = (sysfsName: string): string => {
  const portPath = getUsbPortPath(sysfsName)
  if (portPath == null) return sysfsName

  const mappedLocation = USB_PORT_LOCATIONS.find(
    ([mappedPath]) =>
      portPath === mappedPath || portPath.startsWith(`${mappedPath}.`)
  )

  return mappedLocation?.[1] ?? `USB-${portPath}`
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

const readUsbDevice = async (
  sysName: string
): Promise<AppShellUsbDevice | null> => {
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

const compareUsbSysfsNames = (
  a: AppShellUsbDevice,
  b: AppShellUsbDevice
): number => {
  return a.sysName.localeCompare(b.sysName, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export const getUsbDevices = async (): Promise<AppShellUsbDevice[]> => {
  log.debug(`Reading USB devices from ${USB_SYS_PATH}`)

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
      .filter((device): device is AppShellUsbDevice => device != null)
      .sort(compareUsbSysfsNames)

    log.debug(`Found ${result.length} USB devices`)
    log.debug(`USB devices: ${JSON.stringify(result)}`)

    return result
  } catch (error) {
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error)

    log.error(`Failed to read USB devices: ${message}`)
    return []
  }
}
