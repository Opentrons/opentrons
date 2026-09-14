import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import { useTrackEvent } from '/app/redux/analytics'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '/app/redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'

import { RobotNameEditor } from '..'

import type { NavigateFunction } from 'react-router-dom'

vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/config')
vi.mock('/app/redux/analytics')
vi.mock('/app/redux-resources/config')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

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
      <RobotNameEditor />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotNameEditor', () => {
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
    const user = userEvent.setup()
    const input = screen.getByRole('textbox')
    await user.click(screen.getByRole('button', { name: 'a' }))
    await user.click(screen.getByRole('button', { name: 'b' }))
    await user.click(screen.getByRole('button', { name: 'c' }))
    expect(input).toHaveValue('abc')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalled()
    })
  })

  it('should show an error message when tapping confirm without typing anything', async () => {
    render()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    const error = await screen.findByText(
      'Oops! Robot name must follow the character count and limitations.'
    )
    await waitFor(() => {
      expect(error).toBeInTheDocument()
    })
  })

  it('should show an error message when typing an existing name - connectable robot', async () => {
    render()
    const user = userEvent.setup()
    const input = screen.getByRole('textbox')
    await user.click(screen.getByRole('button', { name: 'c' }))
    await user.click(screen.getByRole('button', { name: 'o' }))
    await user.click(screen.getByRole('button', { name: 'n' }))
    await user.click(screen.getByRole('button', { name: 'n' }))
    await user.click(screen.getByRole('button', { name: 'e' }))
    await user.click(screen.getByRole('button', { name: 'c' }))
    await user.click(screen.getByRole('button', { name: 't' }))
    expect(input).toHaveValue('connect')

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    screen.queryByText('Oops! Name is already in use. Choose a different name.')
  })

  it('should show an error message when typing an existing name - reachable robot', async () => {
    render()
    const user = userEvent.setup()
    const input = screen.getByRole('textbox')
    await user.click(screen.getByRole('button', { name: 'r' }))
    await user.click(screen.getByRole('button', { name: 'e' }))
    await user.click(screen.getByRole('button', { name: 'a' }))
    await user.click(screen.getByRole('button', { name: 'c' }))
    await user.click(screen.getByRole('button', { name: 'h' }))
    expect(input).toHaveValue('reach')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

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

  it('should call a mock function when tapping back button', async () => {
    vi.mocked(useIsUnboxingFlowOngoing).mockReturnValue(false)
    render()
    const user = userEvent.setup()
    await user.click(screen.getByTestId('name_back_button'))
    expect(mockNavigate).toHaveBeenCalledWith('/robot-settings')
  })

  it('should show persistent error when invalid char is typed via external keyboard', async () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a!' } })
    await waitFor(() => {
      expect(input).toHaveValue('a!')
    })
    expect(
      await screen.findByText("Character '!' is not supported")
    ).toBeInTheDocument()
  })

  it('should keep additional typed characters while an invalid char is present', async () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a!' } })
    await waitFor(() => {
      expect(input).toHaveValue('a!')
    })
    fireEvent.change(input, { target: { value: 'a!b' } })
    await waitFor(() => {
      expect(input).toHaveValue('a!b')
    })
    expect(
      screen.getByText("Character '!' is not supported")
    ).toBeInTheDocument()
  })

  it('should clear error and unlock input after deleting the invalid char', async () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a!' } })
    await waitFor(() => {
      expect(input).toHaveValue('a!')
    })
    fireEvent.change(input, { target: { value: 'a' } })
    await waitFor(() => {
      expect(input).toHaveValue('a')
    })
    await waitFor(() => {
      expect(
        screen.queryByText("Character '!' is not supported")
      ).not.toBeInTheDocument()
    })
    fireEvent.change(input, { target: { value: 'ab' } })
    await waitFor(() => {
      expect(input).toHaveValue('ab')
    })
  })
})
