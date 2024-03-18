import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'
import { useEstopQuery } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { EmergencyStop } from '..'
import type * as ReactRouterDom from 'react-router-dom'

vi.mock('@opentrons/react-api-client')

const ESTOP_IMAGE_NAME = 'install_e_stop.png'
const mockDisconnectedEstop = {
  data: {
    status: 'notPresent',
    leftEstopPhysicalStatus: 'notPresent',
    rightEstopPhysicalStatus: 'notPresent',
  },
} as any
const mockPush = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
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

  beforeEach(() => {
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockDisconnectedEstop,
    } as any)
  })

  it('should render text, image, and button when e-stop button is not connected', () => {
    const [{ getByText, getByRole }] = render()
    getByText(
      'Connect the E-stop to an auxiliary port on the back of the robot.'
    )
    getByText('Continue')
    expect(getByRole('button')).toBeDisabled()
    expect(getByRole('img').getAttribute('src')).toContain(ESTOP_IMAGE_NAME)
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
    vi.mocked(useEstopQuery).mockReturnValue({
      data: mockConnectedEstop,
    } as any)
    const [{ getByRole }] = render()
    fireEvent.click(getByRole('button'))
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/rename-robot')
  })
})
