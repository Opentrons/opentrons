import noop from 'lodash/noop'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { app } from 'electron'
import * as Fixtures from '@opentrons/app/src/redux/system-info/__fixtures__'
import * as SystemInfo from '@opentrons/app/src/redux/system-info'
import { uiInitialized } from '@opentrons/app/src/redux/shell/actions'
import * as OS from '../../os'
import { createLogger } from '../../log'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from '../usb-devices'
import {
  getActiveInterfaces,
  createNetworkInterfaceMonitor,
} from '../network-interfaces'
import { registerSystemInfo } from '..'

import type { Dispatch } from '../../types'
import type { UsbDeviceMonitor } from '../usb-devices'
import type { NetworkInterfaceMonitor } from '../network-interfaces'

vi.mock('../../os')
vi.mock('../usb-devices')
vi.mock('../network-interfaces')
vi.mock('electron-store')
vi.mock('../../log', async importOriginal => {
  const actual = await importOriginal<typeof createLogger>()
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
    }),
  }
})
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('app-shell::system-info module action tests', () => {
  const dispatch = vi.fn()
  const getAllDevices = vi.fn()
  const usbMonitor: UsbDeviceMonitor = { getAllDevices, stop: vi.fn() }
  const ifaceMonitor: NetworkInterfaceMonitor = { stop: vi.fn() }
  const { windowsDriverVersion: _, ...notRealtek } = Fixtures.mockUsbDevice
  const realtek0 = { ...notRealtek, manufacturerName: 'Realtek' }
  const realtek1 = { ...notRealtek, manufacturerName: 'realtek' }
  let handler: Dispatch

  beforeEach(() => {
    handler = registerSystemInfo(dispatch)
    vi.mocked(OS.isWindows).mockReturnValue(false)
    vi.mocked(createUsbDeviceMonitor).mockReturnValue(usbMonitor)
    vi.mocked(createNetworkInterfaceMonitor).mockReturnValue(ifaceMonitor)
    getAllDevices.mockResolvedValue([realtek0])
    vi.mocked(getActiveInterfaces).mockReturnValue([
      Fixtures.mockNetworkInterface,
      Fixtures.mockNetworkInterfaceV6,
    ])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('sends initial USB device and network list on shell:UI_INITIALIZED', () => {
    handler(uiInitialized())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        SystemInfo.initialized(
          [realtek0],
          [Fixtures.mockNetworkInterface, Fixtures.mockNetworkInterfaceV6]
        )
      )
      expect(vi.mocked(getWindowsDriverVersion)).toHaveBeenCalledTimes(0)
    })
  })

  it('will not initialize multiple monitors', () => {
    handler(uiInitialized())
    handler(uiInitialized())

    return flush().then(() => {
      expect(createUsbDeviceMonitor).toHaveBeenCalledTimes(1)
      expect(vi.mocked(createNetworkInterfaceMonitor)).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledTimes(2)
    })
  })

  it('sends systemInfo:USB_DEVICE_ADDED when device added', () => {
    handler(uiInitialized())
    const usbMonitorOptions = vi.mocked(createUsbDeviceMonitor).mock.calls[0][0]

    expect(usbMonitorOptions?.onDeviceAdd).toEqual(expect.any(Function))
    const onDeviceAdd = usbMonitorOptions?.onDeviceAdd ?? noop
    onDeviceAdd(realtek0)

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(SystemInfo.usbDeviceAdded(realtek0))
      expect(getWindowsDriverVersion).toHaveBeenCalledTimes(0)
    })
  })

  it('sends systemInfo:USB_DEVICE_REMOVED when device removed', () => {
    handler(uiInitialized())
    const usbMonitorOptions = vi.mocked(createUsbDeviceMonitor).mock.calls[0][0]

    expect(usbMonitorOptions?.onDeviceRemove).toEqual(expect.any(Function))
    const onDeviceRemove = usbMonitorOptions?.onDeviceRemove ?? noop
    onDeviceRemove(realtek0)

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        SystemInfo.usbDeviceRemoved(realtek0)
      )
    })
  })

  it('sends systemInfo:NETWORK_INTERFACES_CHANGED when ifaces change', () => {
    handler(uiInitialized())
    const ifaceMonitorOpts = vi.mocked(createNetworkInterfaceMonitor).mock
      .calls[0][0]

    expect(ifaceMonitorOpts.onInterfaceChange).toEqual(expect.any(Function))
    const { onInterfaceChange } = ifaceMonitorOpts

    onInterfaceChange([
      Fixtures.mockNetworkInterface,
      Fixtures.mockNetworkInterfaceV6,
    ])

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        SystemInfo.networkInterfacesChanged([
          Fixtures.mockNetworkInterface,
          Fixtures.mockNetworkInterfaceV6,
        ])
      )
    })
  })

  it('stops monitoring on app quit', () => {
    handler(uiInitialized())

    const appQuitHandler = vi.mocked(app.once).mock.calls.find(
      // @ts-expect-error(mc, 2021-02-17): event strings don't match, investigate
      ([event, handler]) => event === 'will-quit'
    )?.[1]

    expect(typeof appQuitHandler).toBe('function')
    appQuitHandler?.()
    expect(usbMonitor.stop).toHaveBeenCalled()
    expect(ifaceMonitor.stop).toHaveBeenCalled()
  })

  describe('on windows', () => {
    beforeEach(() => {
      vi.mocked(OS.isWindows).mockReturnValue(true)
      vi.mocked(getWindowsDriverVersion).mockResolvedValue('1.2.3')
    })

    it('should add Windows driver versions to Realtek devices on initialization', () => {
      getAllDevices.mockResolvedValue([realtek0, notRealtek, realtek1])
      handler(uiInitialized())

      return flush().then(() => {
        expect(vi.mocked(getWindowsDriverVersion)).toHaveBeenCalledWith(
          realtek0
        )
        expect(vi.mocked(getWindowsDriverVersion)).toHaveBeenCalledWith(
          realtek1
        )

        expect(dispatch).toHaveBeenCalledWith(
          SystemInfo.initialized(
            [
              { ...realtek0, windowsDriverVersion: '1.2.3' },
              notRealtek,
              { ...realtek1, windowsDriverVersion: '1.2.3' },
            ],
            [Fixtures.mockNetworkInterface, Fixtures.mockNetworkInterfaceV6]
          )
        )
      })
    })

    it('should add Windows driver versions to Realtek devices on add', () => {
      getAllDevices.mockResolvedValue([])
      handler(uiInitialized())
      const usbMonitorOptions = vi.mocked(createUsbDeviceMonitor).mock
        .calls[0][0]
      const onDeviceAdd = usbMonitorOptions?.onDeviceAdd ?? noop
      onDeviceAdd(realtek0)

      return flush().then(() => {
        expect(vi.mocked(getWindowsDriverVersion)).toHaveBeenCalledWith(
          realtek0
        )

        expect(dispatch).toHaveBeenCalledWith(
          SystemInfo.usbDeviceAdded({
            ...realtek0,
            windowsDriverVersion: '1.2.3',
          })
        )
      })
    })
  })
})
