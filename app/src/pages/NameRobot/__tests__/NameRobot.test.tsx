import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { useTrackEvent } from '../../../redux/analytics'
import {
  getConnectableRobots,
  getReachableRobots,
} from '../../../redux/discovery'
import { useIsUnboxingFlowOngoing } from '../../../organisms/RobotSettingsDashboard/NetworkSettings/hooks'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../redux/discovery/__fixtures__'

import { NameRobot } from '..'

jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/config')
jest.mock('../../../redux/analytics')
jest.mock('../../../organisms/RobotSettingsDashboard/NetworkSettings/hooks')

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockuseIsUnboxingFlowOngoing = useIsUnboxingFlowOngoing as jest.MockedFunction<
  typeof useIsUnboxingFlowOngoing
>
let mockTrackEvent: jest.Mock

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
    mockTrackEvent = jest.fn()
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockConnectableRobot.name = 'connect'
    mockReachableRobot.name = 'reach'
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockuseIsUnboxingFlowOngoing.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
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

  it('should show an error message when typing an existing name - connectable robot', async () => {
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
    await waitFor(() =>
      screen.findByText(
        'Oops! Name is already in use. Choose a different name.'
      )
    )
  })

  it('should show an error message when typing an existing name - reachable robot', async () => {
    render()
    const input = screen.getByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: 'r' }))
    fireEvent.click(screen.getByRole('button', { name: 'e' }))
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    fireEvent.click(screen.getByRole('button', { name: 'c' }))
    fireEvent.click(screen.getByRole('button', { name: 'h' }))
    expect(input).toHaveValue('reach')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() =>
      screen.findByText(
        'Oops! Name is already in use. Choose a different name.'
      )
    )
  })

  it('should render text and button when coming from robot settings', () => {
    mockuseIsUnboxingFlowOngoing.mockReturnValue(false)
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
})
