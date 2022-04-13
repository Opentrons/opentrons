import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { getRobotApiVersion } from '../../../../../redux/discovery'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'
import { RobotServerVersion } from '../RobotServerVersion'

jest.mock('../../../../../redux/discovery/selectors')

const mockGetRobotApiVersion = getRobotApiVersion as jest.MockedFunction<
  typeof getRobotApiVersion
>

const MOCK_ROBOT_VERSION = '7.7.7'
const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotServerVersion robot={mockConnectableRobot} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings RobotServerVersion', () => {
  beforeEach(() => {
    mockGetRobotApiVersion.mockReturnValue(MOCK_ROBOT_VERSION)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText }] = render()
    getByText('Robot Server Versions')
    getByText('View latest release notes on')
    getByText('v7.7.7')
  })

  it('should render the message, up to date, if the robot server version is the latest', () => {
    // display 'up to data' message
  })

  it('should render the warning message if the robot server version is not the latest', () => {
    // icon
    // message
    // link
    // click close button
  })

  it('the link should have the correct href', () => {
    const [{ getByText }] = render()
    const GITHUB_LINK =
      'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
    const githubLink = getByText('GitHub')
    expect(githubLink.getAttribute('href')).toBe(GITHUB_LINK)
  })
})
