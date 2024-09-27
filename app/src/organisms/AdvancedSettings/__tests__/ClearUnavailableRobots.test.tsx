import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConditionalConfirm } from '@opentrons/components'
import { i18n } from '/app/i18n'
import { getReachableRobots, getUnreachableRobots } from '/app/redux/discovery'
import {
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'
import { renderWithProviders } from '/app/__testing-utils__'
import { ClearUnavailableRobots } from '../ClearUnavailableRobots'
import type * as OpentronsComponents from '@opentrons/components'

const mockConfirm = vi.fn()
const mockCancel = vi.fn()

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    useConditionalConfirm: vi.fn(() => ({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })),
  }
})

vi.mock('/app/redux/discovery')

const render = () => {
  return renderWithProviders(<ClearUnavailableRobots />, {
    i18nInstance: i18n,
  })
}

describe('ClearUnavailableRobots', () => {
  beforeEach(() => {
    vi.mocked(getUnreachableRobots).mockReturnValue([mockUnreachableRobot])
    vi.mocked(getReachableRobots).mockReturnValue([mockReachableRobot])
    vi.mocked(useConditionalConfirm).mockReturnValue({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })
  })

  it('should render text and button', () => {
    render()
    screen.getByText('Clear Unavailable Robots')
    screen.getByText(
      'Clear the list of unavailable robots on the Devices page. This action cannot be undone.'
    )
    screen.getByRole('button', {
      name: 'Clear unavailable robots list',
    })
  })

  it('should render modal when clicking clear button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )

    screen.getByText('Clear unavailable robots')
    screen.getByText(
      'Clearing the list of unavailable robots on the Devices page cannot be undone.'
    )
    screen.getByRole('button', {
      name: 'cancel',
    })
    screen.getByRole('button', {
      name: 'Clear unavailable robots',
    })
  })

  it('should call mock confirmation when clicking clear button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots',
      })
    )
    expect(mockConfirm).toHaveBeenCalled()
  })

  it('should call mock cancel when clicking cancel button', () => {
    render()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clear unavailable robots list',
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'cancel',
      })
    )
    expect(mockCancel).toHaveBeenCalled()
  })
})
