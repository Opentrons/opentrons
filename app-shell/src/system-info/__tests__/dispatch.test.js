// @flow
import { uiInitialized } from '@opentrons/app/src/shell'
import * as SystemInfo from '@opentrons/app/src/system-info'
import * as Fixtures from '@opentrons/app/src/system-info/__fixtures__'
import { app } from 'electron'
import noop from 'lodash/noop'

import { registerSystemInfo } from '..'
import * as OS from '../../os'
import type {
  NetworkInterface,
  NetworkInterfaceMonitor,
  NetworkInterfaceMonitorOptions,
} from '../network-interfaces'
import * as NetworkInterfaces from '../network-interfaces'
import type {
  Device,
  UsbDeviceMonitor,
  UsbDeviceMonitorOptions,
} from '../usb-devices'
import * as UsbDevices from '../usb-devices'

jest.mock('../../os')
jest.mock('../usb-devices')
jest.mock('../network-interfaces')

const createUsbDeviceMonitor: JestMockFn<
  [UsbDeviceMonitorOptions | void],
  UsbDeviceMonitor
> = UsbDevices.createUsbDeviceMonitor

const getWindowsDriverVersion: JestMockFn<[Device], any> =
  UsbDevices.getWindowsDriverVersion

const getActiveInterfaces: JestMockFn<[], Array<NetworkInterface>> =
  NetworkInterfaces.getActiveInterfaces

const createNetworkInterfaceMonitor: JestMockFn<
  [NetworkInterfaceMonitorOptions],
  NetworkInterfaceMonitor
> = NetworkInterfaces.createNetworkInterfaceMonitor

const isWindows: JestMockFn<[], boolean> = OS.isWindows

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('app-shell::system-info module action tests', () => {
  const dispatch = jest.fn()
  const getAllDevices: JestMockFn<[], any> = jest.fn()
  const usbMonitor: UsbDeviceMonitor = { getAllDevices, stop: jest.fn() }
  const ifaceMonitor: NetworkInterfaceMonitor = { stop: jest.fn() }
  const { windowsDriverVersion: _, ...notRealtek } = Fixtures.mockUsbDevice
  const realtek0 = { ...notRealtek, manufacturer: 'Realtek' }
  const realtek1 = { ...notRealtek, manufacturer: 'realtek' }
  let handler

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

    const appQuitHandler = app.once.mock.calls.find(
      ([event, handler]) => event === 'will-quit'
    )?.[1]

    expect(typeof appQuitHandler).toBe('function')
    appQuitHandler()
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
