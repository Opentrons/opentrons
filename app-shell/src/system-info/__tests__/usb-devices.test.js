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

describe('app-shell::system-info::usb-devices', () => {
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
    const mockDevices = [{ foo: 'foo' }, { bar: 'bar' }, { baz: 'baz' }]

    usbDetection.find.mockResolvedValueOnce(mockDevices)

    const monitor = createUsbDeviceMonitor()
    const result = monitor.getAllDevices()

    return expect(result).resolves.toEqual(mockDevices)
  })

  it('can notify when devices are added', () => {
    const onDeviceAdd = jest.fn()
    createUsbDeviceMonitor({ onDeviceAdd })

    usbDetection.emit('add', { mockDevice: true })

    expect(onDeviceAdd).toHaveBeenCalledWith({ mockDevice: true })
  })

  it('can notify when devices are removed', () => {
    const onDeviceRemove = jest.fn()
    createUsbDeviceMonitor({ onDeviceRemove })

    usbDetection.emit('remove', { mockDevice: true })

    expect(onDeviceRemove).toHaveBeenCalledWith({ mockDevice: true })
  })

  it('can get the Windows driver version of a device', () => {
    execa.command.mockResolvedValue('1.2.3')

    const device = {
      ...Fixtures.mockUsbDevice,
      // 4660 == 0x1234
      vendorId: 4660,
      // 43981 == 0xABCD
      productId: 43981,
      // plain string for serial
      serialNumber: 'abcdefg',
    }

    return getWindowsDriverVersion(device).then(version => {
      expect(execa.command).toHaveBeenCalledWith(
        'Get-PnpDeviceProperty -InstanceID "USB\\VID_1234&PID_ABCD\\abcdefg" -KeyName "DEVPKEY_Device_DriverVersion" | % { $_.Data }',
        { shell: 'PowerShell.exe' }
      )
      expect(version).toBe('1.2.3')
    })
  })

  it('returns null for unknown if command errors out', () => {
    execa.command.mockRejectedValue('AH!')

    const device = {
      ...Fixtures.mockUsbDevice,
      // 4660 == 0x1234
      vendorId: 4660,
      // 43981 == 0xABCD
      productId: 43981,
      // plain string for serial
      serialNumber: 'abcdefg',
    }

    return getWindowsDriverVersion(device).then(version => {
      expect(version).toBe(null)
    })
  })
})
