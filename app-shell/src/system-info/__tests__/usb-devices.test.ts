import execa from 'execa'
import { usb, webusb, Device } from 'usb'

import * as Fixtures from '@opentrons/app/src/redux/system-info/__fixtures__'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from '../usb-devices'

jest.mock('execa')
jest.mock('usb')

const webusbGetDevices = webusb.getDevices as jest.MockedFunction<
  typeof webusb.getDevices
>

const execaCommand = execa.command as jest.MockedFunction<typeof execa.command>

describe('app-shell::system-info::usb-devices', () => {
  const { windowsDriverVersion: _, ...mockDevice } = Fixtures.mockUsbDevice
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can return the list of all devices', async () => {
    const mockDevices = [
      { ...mockDevice, productName: 'foo' },
      { ...mockDevice, productName: 'bar' },
      { ...mockDevice, productName: 'baz' },
    ]

    webusbGetDevices.mockResolvedValueOnce(mockDevices as USBDevice[])

    const monitor = await createUsbDeviceMonitor()
    const result = monitor.getAllDevices()

    await expect(result).resolves.toEqual(mockDevices)
  })

  it('can notify when devices are added', async () => {
    const onDeviceAdd = jest.fn()
    await createUsbDeviceMonitor({ onDeviceAdd })

    usb.emit('attach', mockDevice as Device)

    expect(onDeviceAdd).toHaveBeenCalledWith(mockDevice)
  })

  it('can notify when devices are removed', async () => {
    const onDeviceRemove = jest.fn()
    await createUsbDeviceMonitor({ onDeviceRemove })

    usb.emit('detach', mockDevice as Device)

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
    } as USBDevice

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

    return getWindowsDriverVersion(mockDevice as USBDevice).then(version => {
      expect(version).toBe(null)
    })
  })
})
