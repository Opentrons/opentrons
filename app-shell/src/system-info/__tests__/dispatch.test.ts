import noop from 'lodash/noop'
import { app } from 'electron'
import * as Fixtures from '@opentrons/app/src/redux/system-info/__fixtures__'
import * as SystemInfo from '@opentrons/app/src/redux/system-info'
import { uiInitialized } from '@opentrons/app/src/redux/shell/actions'
import * as OS from '../../os'
import * as UsbDevices from '../usb-devices'
import * as NetworkInterfaces from '../network-interfaces'
import { registerSystemInfo } from '..'

import type { Dispatch } from '../../types'
import type { UsbDeviceMonitor } from '../usb-devices'
import type { NetworkInterfaceMonitor } from '../network-interfaces'

jest.mock('../../os')
jest.mock('../usb-devices')
jest.mock('../network-interfaces')

const createUsbDeviceMonitor = UsbDevices.createUsbDeviceMonitor as jest.MockedFunction<
  typeof UsbDevices.createUsbDeviceMonitor
>

const getWindowsDriverVersion = UsbDevices.getWindowsDriverVersion as jest.MockedFunction<
  typeof UsbDevices.getWindowsDriverVersion
>

const getActiveInterfaces = NetworkInterfaces.getActiveInterfaces as jest.MockedFunction<
  typeof NetworkInterfaces.getActiveInterfaces
>

const createNetworkInterfaceMonitor = NetworkInterfaces.createNetworkInterfaceMonitor as jest.MockedFunction<
  typeof NetworkInterfaces.createNetworkInterfaceMonitor
>

const isWindows = OS.isWindows as jest.MockedFunction<typeof OS.isWindows>

const appOnce = app.once as jest.MockedFunction<typeof app.once>

const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('app-shell::system-info module action tests', () => {
  const dispatch = jest.fn()
  const getAllDevices = jest.fn()
  const usbMonitor: UsbDeviceMonitor = { getAllDevices, stop: jest.fn() }
  const ifaceMonitor: NetworkInterfaceMonitor = { stop: jest.fn() }
  const { windowsDriverVersion: _, ...notRealtek } = Fixtures.mockUsbDevice
  const realtek0 = { ...notRealtek, manufacturer: 'Realtek' }
  const realtek1 = { ...notRealtek, manufacturer: 'realtek' }
  let handler: Dispatch

  beforeEach(() => {
    handler = registerSystemInfo(dispatch)
    isWindows.mockReturnValue(false)
    createUsbDeviceMonitor.mockReturnValue(usbMonitor)
    createNetworkInterfaceMonitor.mockReturnValue(ifaceMonitor)
    getAllDevices.mockResolvedValue([realtek0])
    getActiveInterfaces.mockReturnValue([
      Fixtures.mockNetworkInterface,
      Fixtures.mockNetworkInterfaceV6,
    ])
  })

  afterEach(() => {
    jest.resetAllMocks()
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
      expect(getWindowsDriverVersion).toHaveBeenCalledTimes(0)
    })
  })

  it('will not initialize multiple monitors', () => {
    handler(uiInitialized())
    handler(uiInitialized())

    return flush().then(() => {
      expect(createUsbDeviceMonitor).toHaveBeenCalledTimes(1)
      expect(createNetworkInterfaceMonitor).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledTimes(2)
    })
  })

  it('sends systemInfo:USB_DEVICE_ADDED when device added', () => {
    handler(uiInitialized())
    const usbMonitorOptions = createUsbDeviceMonitor.mock.calls[0][0]

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
    const usbMonitorOptions = createUsbDeviceMonitor.mock.calls[0][0]

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
    const ifaceMonitorOpts = createNetworkInterfaceMonitor.mock.calls[0][0]

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

    const appQuitHandler = appOnce.mock.calls.find(
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
      isWindows.mockReturnValue(true)
      getWindowsDriverVersion.mockResolvedValue('1.2.3')
    })

    it('should add Windows driver versions to Realtek devices on initialization', () => {
      getAllDevices.mockResolvedValue([realtek0, notRealtek, realtek1])
      handler(uiInitialized())

      return flush().then(() => {
        expect(getWindowsDriverVersion).toHaveBeenCalledWith(realtek0)
        expect(getWindowsDriverVersion).toHaveBeenCalledWith(realtek1)

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
      const usbMonitorOptions = createUsbDeviceMonitor.mock.calls[0][0]
      const onDeviceAdd = usbMonitorOptions?.onDeviceAdd ?? noop
      onDeviceAdd(realtek0)

      return flush().then(() => {
        expect(getWindowsDriverVersion).toHaveBeenCalledWith(realtek0)

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
