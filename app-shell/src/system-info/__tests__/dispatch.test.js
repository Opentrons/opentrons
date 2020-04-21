// @flow
import noop from 'lodash/noop'
import * as Fixtures from '@opentrons/app/src/system-info/__fixtures__'
import * as SystemInfo from '@opentrons/app/src/system-info'
import { uiInitialized } from '@opentrons/app/src/shell'
import * as OS from '../../os'
import * as UsbDevices from '../usb-devices'
import { registerSystemInfo } from '..'

import type {
  Device,
  UsbDeviceMonitor,
  UsbDeviceMonitorOptions,
} from '../usb-devices'

jest.mock('../../os')
jest.mock('../usb-devices')

// TODO(mc, 2020-04-21): remove feature flag
jest.mock('../../config', () => ({
  getFullConfig: () => ({ devInternal: { enableSystemInfo: true } }),
}))

const createUsbDeviceMonitor: JestMockFn<
  [UsbDeviceMonitorOptions | void],
  UsbDeviceMonitor
> = UsbDevices.createUsbDeviceMonitor

const getWindowsDriverVersion: JestMockFn<[Device], any> =
  UsbDevices.getWindowsDriverVersion

const isWindows: JestMockFn<[], boolean> = OS.isWindows

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('app-shell::system-info module action tests', () => {
  const dispatch = jest.fn()
  const getAllDevices: JestMockFn<[], any> = jest.fn()
  const monitor: $Shape<UsbDeviceMonitor> = { getAllDevices }
  const { windowsDriverVersion: _, ...notRealtek } = Fixtures.mockUsbDevice
  const realtek0 = { ...notRealtek, manufacturer: 'Realtek' }
  const realtek1 = { ...notRealtek, manufacturer: 'realtek' }
  let handler

  beforeEach(() => {
    handler = registerSystemInfo(dispatch)
    isWindows.mockReturnValue(false)
    createUsbDeviceMonitor.mockReturnValue(monitor)
    getAllDevices.mockResolvedValue([realtek0])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('sends initial USB device list on shell:UI_INITIALIZED', () => {
    handler(uiInitialized())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(SystemInfo.initialized([realtek0]))
      expect(getWindowsDriverVersion).toHaveBeenCalledTimes(0)
    })
  })

  it('will not initialize multiple monitors', () => {
    handler(uiInitialized())
    handler(uiInitialized())

    return flush().then(() => {
      expect(createUsbDeviceMonitor).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledTimes(1)
    })
  })

  it('sends systemInfo:USB_DEVICE_ADDED when device added', () => {
    handler(uiInitialized())
    const monitorOptions = createUsbDeviceMonitor.mock.calls[0][0]

    expect(monitorOptions?.onDeviceAdd).toEqual(expect.any(Function))
    const onDeviceAdd = monitorOptions?.onDeviceAdd ?? noop
    onDeviceAdd(realtek0)

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(SystemInfo.usbDeviceAdded(realtek0))
      expect(getWindowsDriverVersion).toHaveBeenCalledTimes(0)
    })
  })

  it('sends systemInfo:USB_DEVICE_REMOVED when device removed', () => {
    handler(uiInitialized())
    const monitorOptions = createUsbDeviceMonitor.mock.calls[0][0]

    expect(monitorOptions?.onDeviceRemove).toEqual(expect.any(Function))
    const onDeviceRemove = monitorOptions?.onDeviceRemove ?? noop
    onDeviceRemove(realtek0)

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        SystemInfo.usbDeviceRemoved(realtek0)
      )
    })
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
          SystemInfo.initialized([
            { ...realtek0, windowsDriverVersion: '1.2.3' },
            notRealtek,
            { ...realtek1, windowsDriverVersion: '1.2.3' },
          ])
        )
      })
    })

    it('should add Windows driver versions to Realtek devices on add', () => {
      getAllDevices.mockResolvedValue([])
      handler(uiInitialized())
      const monitorOptions = createUsbDeviceMonitor.mock.calls[0][0]
      const onDeviceAdd = monitorOptions?.onDeviceAdd ?? noop
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
