import { readdir, readFile, realpath } from 'fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isSingleFunctionMassStorageMount } from '../usb'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  realpath: vi.fn(),
  // referenced elsewhere in the module under test
  stat: vi.fn(),
  unlink: vi.fn(),
}))
vi.mock('../../log')

const USB_DEVICES_DIR = '/sys/bus/usb/devices'

interface FakeSysfs {
  // maps `/sys/block/<disk>/device` -> the realpath it resolves to
  realpaths: Record<string, string>
  // maps usb device name -> { interfaceDirName: bInterfaceClass }
  interfaces: Record<string, Record<string, string>>
}

const mockSysfs = ({ realpaths, interfaces }: FakeSysfs): void => {
  vi.mocked(realpath).mockImplementation((path: any): any => {
    const key = String(path)
    return key in realpaths
      ? Promise.resolve(realpaths[key])
      : Promise.reject(new Error(`ENOENT: ${key}`))
  })
  vi.mocked(readdir).mockImplementation((path: any): any => {
    const device = String(path).slice(`${USB_DEVICES_DIR}/`.length)
    const deviceInterfaces = interfaces[device]
    if (deviceInterfaces == null) {
      return Promise.reject(new Error(`ENOENT: ${String(path)}`))
    }
    // include some non-interface descriptor files to exercise the filter
    return Promise.resolve([
      ...Object.keys(deviceInterfaces),
      'idVendor',
      'product',
    ])
  })
  vi.mocked(readFile).mockImplementation((path: any): any => {
    const relative = String(path).slice(`${USB_DEVICES_DIR}/`.length)
    const [device, interfaceDir, file] = relative.split('/')
    if (
      file === 'bInterfaceClass' &&
      interfaces[device]?.[interfaceDir] != null
    ) {
      return Promise.resolve(interfaces[device][interfaceDir])
    }
    return Promise.reject(new Error(`ENOENT: ${String(path)}`))
  })
}

describe('usb/usb isSingleFunctionMassStorageMount', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns true for a single-function mass-storage device', async () => {
    mockSysfs({
      realpaths: {
        '/sys/block/sdb/device':
          '/sys/devices/platform/usb1/1-1/1-1.6/1-1.6:1.0/host4/target4:0:0/4:0:0:0',
      },
      interfaces: { '1-1.6': { '1-1.6:1.0': '08' } },
    })

    await expect(
      isSingleFunctionMassStorageMount('/media/MYUSB-sdb1')
    ).resolves.toBe(true)
  })

  it('returns false for a composite device that only exposes storage among other interfaces', async () => {
    mockSysfs({
      realpaths: {
        '/sys/block/sdc/device':
          '/sys/devices/platform/usb1/1-1/1-1.3/1-1.3.4/1-1.3.4:1.2/host5/target5:0:0/5:0:0:0',
      },
      interfaces: {
        '1-1.3.4': {
          '1-1.3.4:1.0': '02',
          '1-1.3.4:1.1': '0a',
          '1-1.3.4:1.2': '08',
          '1-1.3.4:1.3': '03',
          '1-1.3.4:1.4': '01',
          '1-1.3.4:1.5': '01',
        },
      },
    })

    await expect(
      isSingleFunctionMassStorageMount('/media/PHONE-sdc1')
    ).resolves.toBe(false)
  })

  it('handles an unlabeled mount dir (just sdX#)', async () => {
    mockSysfs({
      realpaths: {
        '/sys/block/sdb/device':
          '/sys/devices/platform/usb1/1-1/1-1.6/1-1.6:1.0/host4/target4:0:0/4:0:0:0',
      },
      interfaces: { '1-1.6': { '1-1.6:1.0': '08' } },
    })

    await expect(isSingleFunctionMassStorageMount('/media/sdb1')).resolves.toBe(
      true
    )
  })

  it('fails open (returns true) when the backing device cannot be resolved', async () => {
    mockSysfs({ realpaths: {}, interfaces: {} })

    await expect(
      isSingleFunctionMassStorageMount('/media/MYSTERY-sdz9')
    ).resolves.toBe(true)
  })

  it('returns true when the path has no recognizable block node', async () => {
    mockSysfs({ realpaths: {}, interfaces: {} })

    await expect(
      isSingleFunctionMassStorageMount('/media/not-a-block-device')
    ).resolves.toBe(true)
  })
})
