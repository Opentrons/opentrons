import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Devices } from '..'

import type { ComponentProps } from 'react'
import type { State } from '/app/redux/types'

const mockFunc = vi.fn()

const render = (props: ComponentProps<typeof Devices>) => {
  return renderWithProviders(<Devices {...props} />, {
    i18nInstance: i18n,
    initialState: {
      systemInfo: {
        usbDevices: [
          {
            identifier: 'keyboard-1',
            productName: 'Keyboard',
            manufacturerName: 'External',
            vendorId: 1,
            productId: 2,
            serialNumber: 'abc',
            location: 'FRONTPORT',
          },
          {
            identifier: 'drive-1',
            productName: 'USB drive',
            manufacturerName: null,
            vendorId: 3,
            productId: 4,
            serialNumber: null,
            location: 'USB-2',
          },
          {
            identifier: 'rear-panel-1',
            productName: 'Opentrons RearPanel FS',
            manufacturerName: 'Opentrons',
            vendorId: null,
            productId: null,
            serialNumber: null,
            location: 'INTERNAL',
          },
        ],
        networkInterfaces: [],
      },
    } as unknown as State,
  })
}

describe('Devices', () => {
  let props: ComponentProps<typeof Devices>

  beforeEach(() => {
    props = {
      robotName: 'mockRobot',
      setCurrentOption: mockFunc,
    }
  })

  it('should render the devices table', () => {
    render(props)
    screen.getByText('Device')
    screen.getByText('Location')
    screen.getByText('Location')
    screen.getByText('External Keyboard')
    screen.getByText('FRONTPORT')
    screen.getByText('USB drive')
    screen.getByText('USB-2')
    screen.getByText('Opentrons RearPanel FS')
    screen.getByText('INTERNAL')
  })

  it('should call mock function when tapping back button', () => {
    render(props)
    const backButton = screen.getByRole('button')
    fireEvent.click(backButton)
    expect(mockFunc).toHaveBeenCalled()
  })
})
