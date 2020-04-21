// @flow

import execa from 'execa'
import usbDetection from 'usb-detection'

import * as Fixtures from '@opentrons/app/src/system-info/__fixtures__'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from '../usb-devices'

jest.mock('execa')
jest.mock('usb-detection', () => {
  const EventEmitter = require('events')
  const detector = new EventEmitter()
  detector.startMonitoring = jest.fn()
  detector.stopMonitoring = jest.fn()
  detector.find = jest.fn()
  return detector
})

const usbDetectionFind: JestMockFn<[], any> = (usbDetection.find: any)

describe('app-shell::system-info::usb-devices', () => {
  const { windowsDriverVersion: _, ...mockDevice } = Fixtures.mockUsbDevice
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can create a usb device monitor', () => {
    expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(0)
    createUsbDeviceMonitor()
    expect(usbDetection.startMonitoring).toHaveBeenCalledTimes(1)
  })

  it('usb device monitor can be stopped', () => {
    const monitor = createUsbDeviceMonitor()
    monitor.stop()
    expect(usbDetection.stopMonitoring).toHaveBeenCalledTimes(1)
  })

  it('can return the list of all devices', () => {
    const mockDevices = [
      { ...mockDevice, deviceName: 'foo' },
      { ...mockDevice, deviceName: 'bar' },
      { ...mockDevice, deviceName: 'baz' },
    ]

    usbDetectionFind.mockResolvedValueOnce(mockDevices)

    const monitor = createUsbDeviceMonitor()
    const result = monitor.getAllDevices()

    return expect(result).resolves.toEqual(mockDevices)
  })

  it('can notify when devices are added', () => {
    const onDeviceAdd = jest.fn()
    createUsbDeviceMonitor({ onDeviceAdd })

    usbDetection.emit('add', mockDevice)

    expect(onDeviceAdd).toHaveBeenCalledWith(mockDevice)
  })

  it('can notify when devices are removed', () => {
    const onDeviceRemove = jest.fn()
    createUsbDeviceMonitor({ onDeviceRemove })

    usbDetection.emit('remove', mockDevice)

    expect(onDeviceRemove).toHaveBeenCalledWith(mockDevice)
  })

  it('can get the Windows driver version of a device', () => {
    execa.command.mockResolvedValue({ stdout: '1.2.3' })

    const device = {
      ...mockDevice,
      // 291 == 0x0123
      vendorId: 291,
      // 43981 == 0xABCD
      productId: 43981,
      // plain string for serial
      serialNumber: 'abcdefg',
    }

    return getWindowsDriverVersion(device).then(version => {
      expect(execa.command).toHaveBeenCalledWith(
        'Get-PnpDeviceProperty -InstanceID "USB\\VID_0123&PID_ABCD\\abcdefg" -KeyName "DEVPKEY_Device_DriverVersion" | % { $_.Data }',
        { shell: 'PowerShell.exe' }
      )
      expect(version).toBe('1.2.3')
    })
  })

  it('returns null for unknown if command errors out', () => {
    execa.command.mockRejectedValue('AH!')

    return getWindowsDriverVersion(mockDevice).then(version => {
      expect(version).toBe(null)
    })
  })
})
