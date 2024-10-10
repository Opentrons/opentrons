import { vi, it, describe, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { i18n } from '/app/i18n'
import { renderWithProviders } from '/app/__testing-utils__'
import { useTrackEvent } from '/app/redux/analytics'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '/app/redux/discovery'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'

import { NameRobot } from '..'
import type { NavigateFunction } from 'react-router-dom'

vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/config')
vi.mock('/app/redux/analytics')
vi.mock('/app/redux-resources/config')

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockTrackEvent = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <NameRobot />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('NameRobot', () => {
  beforeEach(() => {
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    mockConnectableRobot.name = 'connectableOtie'
    mockReachableRobot.name = 'reachableOtie'
    mockUnreachableRobot.name = 'unreachableOtie'
    vi.mocked(getConnectableRobots).mockReturnValue([mockConnectableRobot])
    vi.mocked(getReachableRobots).mockReturnValue([mockReachableRobot])
    vi.mocked(getUnreachableRobots).mockReturnValue([mockUnreachableRobot])
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(true)
  })

  it('should render text, button and keyboard', () => {
    render()
    screen.getByText('Name your robot')
    screen.getByText(
      'Don’t worry, you can always change this in your settings.'
    )
    screen.getByText('Enter up to 17 characters (letters and numbers only)')
    screen.getByRole('textbox')
    screen.getByText('Confirm')
    // keyboard
    screen.getByRole('button', { name: 'a' })
  })

  it('should display a letter when typing a letter and confirming calls the track event', async () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    fireEvent.click(screen.getByRole('button', { name: 'b' }))
    fireEvent.click(screen.getByRole('button', { name: 'c' }))
    expect(input).toHaveValue('abc')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(mockTrackEvent).toHaveBeenCalled())
  })

  it('should show an error message when tapping confirm without typing anything', async () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    const error = await screen.findByText(
      'Oops! Robot name must follow the character count and limitations.'
    )
    await waitFor(() => {
      expect(error).toBeInTheDocument()
    })
  })

  it('should show an error message when typing an existing name - connectable robot', () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'c' }))
    fireEvent.click(screen.getByRole('button', { name: 'o' }))
    fireEvent.click(screen.getByRole('button', { name: 'n' }))
    fireEvent.click(screen.getByRole('button', { name: 'n' }))
    fireEvent.click(screen.getByRole('button', { name: 'e' }))
    fireEvent.click(screen.getByRole('button', { name: 'c' }))
    fireEvent.click(screen.getByRole('button', { name: 't' }))
    expect(input).toHaveValue('connect')

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    screen.queryByText('Oops! Name is already in use. Choose a different name.')
  })

  it('should show an error message when typing an existing name - reachable robot', () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'r' }))
    fireEvent.click(screen.getByRole('button', { name: 'e' }))
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    fireEvent.click(screen.getByRole('button', { name: 'c' }))
    fireEvent.click(screen.getByRole('button', { name: 'h' }))
    expect(input).toHaveValue('reach')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    screen.queryByText('Oops! Name is already in use. Choose a different name.')
  })

  it('should render text and button when coming from robot settings', () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(false)
    render()
    screen.getByText('Rename robot')
    expect(
      screen.queryByText(
        'Don’t worry, you can always change this in your settings.'
      )
    ).not.toBeInTheDocument()
    screen.getByText('Enter up to 17 characters (letters and numbers only)')
    screen.getByText('Confirm')
  })

  it('should call a mock function when tapping back button', () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(false)
    render()
    fireEvent.click(screen.getByTestId('name_back_button'))
    expect(mockNavigate).toHaveBeenCalledWith('/robot-settings')
  })
})
