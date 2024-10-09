import { vi, it, describe, expect, beforeEach } from 'vitest'
import { useEstopQuery } from '@opentrons/react-api-client'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { EmergencyStop } from '..'
import type { NavigateFunction } from 'react-router-dom'

vi.mock('@opentrons/react-api-client')

const ESTOP_IMAGE_NAME = 'install_e_stop.png'
const mockDisconnectedEstop = {
  data: {
    status: 'notPresent',
    leftEstopPhysicalStatus: 'notPresent',
    rightEstopPhysicalStatus: 'notPresent',
  },
} as any
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(<EmergencyStop />, {
    i18nInstance: i18n,
  })
}

describe('EmergencyStop', () => {
  // Note (kk:06/28/2023) commented test cases will be activated when added the function to check e-stop status

  beforeEach(() => {
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockDisconnectedEstop,
    } as any)
  })

  it('should render text, image, and button when e-stop button is not connected', () => {
    render()
    screen.getByText(
      'Connect the E-stop to an auxiliary port on the back of the robot.'
    )
    screen.getByText('Continue')
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('img').getAttribute('src')).toContain(
      ESTOP_IMAGE_NAME
    )
  })

  it('should render text, icon, button when e-stop button is connected', () => {
    const mockConnectedEstop = {
      data: {
        status: 'disengaged',
        leftEstopPhysicalStatus: 'disengaged',
        rightEstopPhysicalStatus: 'notPresent',
      },
    }
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockConnectedEstop,
    } as any)
    render()
    screen.getByTestId('EmergencyStop_connected_icon')
    screen.getByText('E-stop successfully connected')
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('should call a mock function when tapping continue button', () => {
    const mockConnectedEstop = {
      data: {
        status: 'disengaged',
        leftEstopPhysicalStatus: 'disengaged',
        rightEstopPhysicalStatus: 'notPresent',
      },
    } as any
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockConnectedEstop,
    } as any)
    render()
    fireEvent.click(screen.getByRole('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/robot-settings/rename-robot')
  })
})
