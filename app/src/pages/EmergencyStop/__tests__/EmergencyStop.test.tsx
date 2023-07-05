import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { EmergencyStop } from '..'

// const ESTOP_IMAGE_NAME = 'install_e_stop.png'
const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(<EmergencyStop />, {
    i18nInstance: i18n,
  })
}

describe('EmergencyStop', () => {
  // Note (kk:06/28/2023) commented test cases will be activated when added the function to check e-stop status

  it.todo(
    'should render text, image, and button when e-stop button is not connected'
  )

  it('should render text, icon, button when e-stop button is connected', () => {
    const [{ getByText, getByTestId, getByRole }] = render()
    getByTestId('EmergencyStop_connected_icon')
    getByText('E-stop successfully connected')
    expect(getByRole('button')).not.toBeDisabled()
  })

  it.todo('should call a mock function when tapping continue button')
})
