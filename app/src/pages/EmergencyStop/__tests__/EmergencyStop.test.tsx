import * as React from 'react'
import { useEstopQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { EmergencyStop } from '..'

jest.mock('@opentrons/react-api-client')

const ESTOP_IMAGE_NAME = 'install_e_stop.png'
const mockDisconnectedEstop = {
  data: {
    status: 'notPresent',
    leftEstopPhysicalStatus: 'notPresent',
    rightEstopPhysicalStatus: 'notPresent',
  },
} as any
const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseEstopQuery = useEstopQuery as jest.MockedFunction<
  typeof useEstopQuery
>

const render = () => {
  return renderWithProviders(<EmergencyStop />, {
    i18nInstance: i18n,
  })
}

describe('EmergencyStop', () => {
  // Note (kk:06/28/2023) commented test cases will be activated when added the function to check e-stop status

  beforeEach(() => {
    mockUseEstopQuery.mockReturnValue({ data: mockDisconnectedEstop } as any)
  })

  it('should render text, image, and button when e-stop button is not connected', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Connect the E-stop to an auxiliary port on the back of the robot.'
    )
    getByText('Continue')
    expect(getByRole('button')).toBeDisabled()
    expect(getByRole('img').getAttribute('src')).toEqual(ESTOP_IMAGE_NAME)
  })

  it('should render text, icon, button when e-stop button is connected', () => {
    const mockConnectedEstop = {
      data: {
        status: 'disengaged',
        leftEstopPhysicalStatus: 'disengaged',
        rightEstopPhysicalStatus: 'notPresent',
      },
    }
    mockUseEstopQuery.mockReturnValue({ data: mockConnectedEstop } as any)
    const [{ getByText, getByTestId, getByRole }] = render()
    getByTestId('EmergencyStop_connected_icon')
    getByText('E-stop successfully connected')
    expect(getByRole('button')).not.toBeDisabled()
  })

  it('should call a mock function when tapping continue button', () => {
    const mockConnectedEstop = {
      data: {
        status: 'disengaged',
        leftEstopPhysicalStatus: 'disengaged',
        rightEstopPhysicalStatus: 'notPresent',
      },
    } as any
    mockUseEstopQuery.mockReturnValue({ data: mockConnectedEstop } as any)
    const [{ getByRole }] = render()
    getByRole('button').click()
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/rename-robot')
  })
})
