import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { useRobot } from '../../../hooks'
import { getRobotApiVersion } from '../../../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../../../redux/buildroot'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'
import { RobotServerVersion } from '../RobotServerVersion'

jest.mock('../../../hooks')
jest.mock('../../../../../redux/buildroot/selectors')
jest.mock('../../../../../redux/discovery/selectors')

const mockGetRobotApiVersion = getRobotApiVersion as jest.MockedFunction<
  typeof getRobotApiVersion
>
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const MOCK_ROBOT_VERSION = '7.7.7'
const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotServerVersion robotName="otie" />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings RobotServerVersion', () => {
  beforeEach(() => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
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

  it('should render the message, up to date, if the robot server version is the same as the latest version', () => {
    // display 'up to data' message
    const [{ getByText }] = render()
    getByText('up to date')
  })

  it('should render the warning message if the robot server version needs to upgrade', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const [{ getByText }] = render()
    getByText('A software update is available for this robot.')
    getByText('View update')
  })

  it('should render the warning message if the robot server version needs to downgrade', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'downgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const [{ getByText }] = render()
    getByText('A software update is available for this robot.')
    getByText('View update')
  })

  it('the link should have the correct href', () => {
    const [{ getByText }] = render()
    const GITHUB_LINK =
      'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
    const githubLink = getByText('GitHub')
    expect(githubLink.getAttribute('href')).toBe(GITHUB_LINK)
  })
})
