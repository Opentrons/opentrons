import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { RobotDashboard } from '../RobotDashboard'

const PNG_FILE_NAME = 'abstract@x2.png'

const mockPush = jest.fn()

jest.mock('../../../redux/discovery')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotDashboard />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotDashboard', () => {
  beforeEach(() => {
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text, image, and buttons', () => {
    const [{ getByText, getByRole, getAllByRole }] = render()
    getByText('opentrons-robot-name')
    getByText('Ready')
    getByText('Run again')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
    getByText('You haven’t run anything!')
    getByText(
      'Send a protocol to your OT-3 from the desktop app to get started!'
    )
    getByText('Run a protocol')
    getByText('Instrument + Module Hub')
    getByText('Settings')
    const buttons = getAllByRole('button')
    // ToDo this will be removed when removing the link to odd menu
    expect(buttons.length).toBe(6)
  })

  // ToDo: kj 12/07/2022 enable this case when the design is fixed
  // it('should call a mock function when tapping an icon button', () => {
  //   const [{ getByTestId }] = render()
  //   const rightButton = getByTestId('RobotDashboard_right_button')
  //   const leftButton = getByTestId('RobotDashboard_left_button')
  //   fireEvent.click(rightButton)
  //   fireEvent.click(leftButton)
  //   expect()
  //   expect()
  // })

  it('should call a mock function when tapping a button', () => {
    const [{ getByText }] = render()
    // ToDo: kj 12/07/2022 update routes when we fix them
    const runProtocolButton = getByText('Run a protocol')
    const instrumentHubButton = getByText('Instrument + Module Hub')
    const settingsButton = getByText('Settings')
    fireEvent.click(runProtocolButton)
    fireEvent.click(instrumentHubButton)
    fireEvent.click(settingsButton)
    expect(mockPush).toHaveBeenCalledTimes(3)
    expect(mockPush).toHaveBeenCalledWith('/protocols')
    expect(mockPush).toHaveBeenCalledWith('/robot-settings')
    expect(mockPush).toHaveBeenCalledWith('/attach-instruments')
  })
})
