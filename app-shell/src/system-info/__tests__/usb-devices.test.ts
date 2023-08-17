import execa from 'execa'
import usbDetection from 'usb-detection'

import * as Fixtures from '@opentrons/app/src/redux/system-info/__fixtures__'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from '../usb-devices'

jest.mock('execa')
jest.mock('usb-detection')

const usbDetectionFind = usbDetection.find as jest.MockedFunction<
  typeof usbDetection.find
>

const execaCommand = execa.command as jest.MockedFunction<typeof execa.command>

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

  it('can return the list of all devices', async () => {
    const mockDevices = [
      { ...mockDevice, deviceName: 'foo' },
      { ...mockDevice, deviceName: 'bar' },
      { ...mockDevice, deviceName: 'baz' },
    ]

    usbDetectionFind.mockResolvedValueOnce(mockDevices)

    const monitor = createUsbDeviceMonitor()
    const result = monitor.getAllDevices()

    await expect(result).resolves.toEqual(mockDevices)
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
    execaCommand.mockResolvedValue({ stdout: '1.2.3' } as any)

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
      expect(
        execa.command
      ).toHaveBeenCalledWith(
        'Get-PnpDeviceProperty -InstanceID "USB\\VID_0123&PID_ABCD\\abcdefg" -KeyName "DEVPKEY_Device_DriverVersion" | % { $_.Data }',
        { shell: 'PowerShell.exe' }
      )
      expect(version).toBe('1.2.3')
    })
  })

  it('returns null for unknown if command errors out', () => {
    execaCommand.mockRejectedValue('AH!')

    return getWindowsDriverVersion(mockDevice).then(version => {
      expect(version).toBe(null)
    })
  })
})
