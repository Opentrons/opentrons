import execa from 'execa'
import { usb } from 'usb'

import * as Fixtures from '@opentrons/app/src/redux/system-info/__fixtures__'
import { createUsbDeviceMonitor, getWindowsDriverVersion } from '../usb-devices'
import { isWindows } from '../../os'

jest.mock('execa')
jest.mock('usb')

const usbGetDeviceList = usb.getDeviceList as jest.MockedFunction<
  typeof usb.getDeviceList
>

const usbDeviceGetStringDescriptor = jest.fn() as jest.MockedFunction<
  InstanceType<typeof usb.Device>['getStringDescriptor']
>

const usbDeviceOpen = jest.fn() as jest.MockedFunction<
  InstanceType<typeof usb.Device>['open']
>
const usbDeviceClose = jest.fn() as jest.MockedFunction<
  InstanceType<typeof usb.Device>['close']
>
const usbOn = usb.on as jest.MockedFunction<typeof usb.on>

const execaCommand = execa.command as jest.MockedFunction<typeof execa.command>

const mockFixtureDevice = {
  ...Fixtures.mockUsbDevice,
  identifier: 'ec2c23ab245e0424059c3ad99e626cdb',
}

const mockDescriptor = {
  busNumber: 3,
  deviceAddress: 10,
  deviceDescriptor: {
    idVendor: Fixtures.mockUsbDevice.vendorId,
    idProduct: Fixtures.mockUsbDevice.productId,
    iSerialNumber: 0,
    iManufacturer: 1,
    iProduct: 2,
  },
}

const getSerialIterator = () => {
  const serials = ['sn1', 'sn2', 'sn3']
  let idx = 0
  return () => {
    idx += 1
    return serials[idx - 1]
  }
}

const getManufacturerIterator = () => {
  const mfrs = ['mfr1', 'mfr2', 'mfr3']
  let idx = 0
  return () => {
    idx += 1
    return mfrs[idx - 1]
  }
}

const getProductIterator = () => {
  const products = ['pr1', 'pr2', 'pr3']
  let idx = 0
  return () => {
    idx += 1
    return products[idx - 1]
  }
}

const mockUSBDevice = {
  ...mockDescriptor,
  getStringDescriptor: usbDeviceGetStringDescriptor,
  open: usbDeviceOpen,
  close: usbDeviceClose,
}

if (!isWindows()) {
  describe('app-shell::system-info::usb-devices::detection', () => {
    const { windowsDriverVersion: _, ...mockDevice } = Fixtures.mockUsbDevice
    afterEach(() => {
      jest.resetAllMocks()
    })

    it('can return the list of all devices', async () => {
      const mockDevices = [mockUSBDevice, mockUSBDevice, mockUSBDevice] as any
      const serialIterator = getSerialIterator()
      const mfrIterator = getManufacturerIterator()
      const productIterator = getProductIterator()
      usbGetDeviceList.mockReturnValueOnce(mockDevices)
      usbDeviceGetStringDescriptor.mockImplementation(
        (descriptorId, callback) =>
          callback(
            undefined,
            [serialIterator, mfrIterator, productIterator][descriptorId]()
          )
      )

      const monitor = createUsbDeviceMonitor()
      const result = monitor.getAllDevices()
      const devices = await result

      expect(devices).toEqual([
        {
          ...mockFixtureDevice,
          manufacturerName: 'mfr1',
          serialNumber: 'sn1',
          productName: 'pr1',
        },
        {
          ...mockFixtureDevice,
          manufacturerName: 'mfr2',
          serialNumber: 'sn2',
          productName: 'pr2',
        },
        {
          ...mockFixtureDevice,
          manufacturerName: 'mfr3',
          serialNumber: 'sn3',
          productName: 'pr3',
        },
      ])
    })

    it('can notify when devices are added', () =>
      new Promise<void>((resolve, reject) => {
        const onDeviceAdd = jest.fn()
        onDeviceAdd.mockImplementation(device => {
          try {
            expect(device).toEqual({
              ...mockFixtureDevice,
              manufacturerName: 'mfr1',
              serialNumber: 'sn1',
              productName: 'pn1',
            })
            resolve()
          } catch (error) {
            reject(error)
          }
        })
        let attachListener
        usbOn.mockImplementationOnce((event, listener) => {
          if (event === 'attach') {
            attachListener = listener
          }
        })
        createUsbDeviceMonitor({ onDeviceAdd })
        usbDeviceGetStringDescriptor.mockImplementation(
          (descriptorId, callback) =>
            callback(undefined, ['sn1', 'mfr1', 'pn1'][descriptorId])
        )
        if (attachListener) {
          // @ts-expect-error: this is gross
          attachListener(mockUSBDevice)
        } else {
          reject(new Error('attachListener was not defined'))
        }
      }))

    it('can notify when devices are removed', () =>
      new Promise<void>((resolve, reject) => {
        const onDeviceRemove = jest.fn()
        onDeviceRemove.mockImplementation(device => {
          try {
            expect(device).toEqual({
              vendorId: mockDevice.vendorId,
              productId: mockDevice.productId,
              identifier: 'ec2c23ab245e0424059c3ad99e626cdb',
              manufacturerName: undefined,
              productName: undefined,
              serialNumber: undefined,
              systemIdentifier: undefined,
            })
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        let detachListener

        usbOn.mockImplementationOnce((event, listener) => {
          if (event === 'detach') {
            detachListener = listener
          }
        })
        usbDeviceOpen.mockImplementation(() => {
          throw new Error('Cannot open detached device')
        })
        createUsbDeviceMonitor({ onDeviceRemove })
        if (detachListener) {
          // @ts-expect-error: this is gross
          detachListener(mockUSBDevice)
        } else {
          reject(new Error('detachListener was not created'))
        }
      }))
  })
}

describe('app-shell::system-info::usb-devices', () => {
  const { windowsDriverVersion: _, ...mockDevice } = Fixtures.mockUsbDevice
  afterEach(() => {
    jest.resetAllMocks()
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
