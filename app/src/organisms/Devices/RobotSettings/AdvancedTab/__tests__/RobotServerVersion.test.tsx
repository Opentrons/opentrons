import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { getRobotApiVersion } from '../../../../../redux/discovery'
import { getBuildrootUpdateDisplayInfo } from '../../../../../redux/buildroot'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'
import { useRobot, useRobotBusyAndUpdateAlertEnabled } from '../../../hooks'
import { UpdateBuildroot } from '../../UpdateBuildroot'
import { RobotServerVersion } from '../RobotServerVersion'

jest.mock('../../../hooks')
jest.mock('../../../../../redux/buildroot/selectors')
jest.mock('../../../../../redux/discovery/selectors')
jest.mock('../../UpdateBuildroot')

const mockGetRobotApiVersion = getRobotApiVersion as jest.MockedFunction<
  typeof getRobotApiVersion
>
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const mockRobotBusyAndUpdateAlertEnabled = useRobotBusyAndUpdateAlertEnabled as jest.MockedFunction<
  typeof useRobotBusyAndUpdateAlertEnabled
>

const mockUpdateBuildroot = UpdateBuildroot as jest.MockedFunction<
  typeof UpdateBuildroot
>

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
    mockUpdateBuildroot.mockReturnValue(<div>mock update buildroot</div>)
    mockRobotBusyAndUpdateAlertEnabled.mockReturnValue({
      isRobotBusy: false,
      isUpdateAlertEnabled: true,
    })
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
    const [{ getByText, getByRole }] = render()
    getByText('up to date')
    const reinstall = getByRole('button', { name: 'reinstall' })
    fireEvent.click(reinstall)
    getByText('mock update buildroot')
  })

  it('should render the warning message if the robot server version needs to upgrade', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const [{ getByText }] = render()
    getByText('A software update is available for this robot.')
    const btn = getByText('View update')
    fireEvent.click(btn)
    getByText('mock update buildroot')
  })

  it('should not render the warning message if the robot server version needs to upgrade because robot is busy', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockRobotBusyAndUpdateAlertEnabled.mockReturnValue({
      isRobotBusy: true,
      isUpdateAlertEnabled: true,
    })
    expect(
      screen.queryByText('A software update is available for this robot.')
    ).toBeNull()
  })

  it('should not render the warning message if the robot server version needs to upgrade because alert update is not enabled', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockRobotBusyAndUpdateAlertEnabled.mockReturnValue({
      isRobotBusy: false,
      isUpdateAlertEnabled: false,
    })
    expect(
      screen.queryByText('A software update is available for this robot.')
    ).toBeNull()
  })

  it('should render the warning message if the robot server version needs to downgrade', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'downgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const [{ getByText }] = render()
    getByText('A software update is available for this robot.')
    const btn = getByText('View update')
    fireEvent.click(btn)
    getByText('mock update buildroot')
  })

  it('the link should have the correct href', () => {
    const [{ getByText }] = render()
    const GITHUB_LINK =
      'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
    const githubLink = getByText('GitHub')
    expect(githubLink.getAttribute('href')).toBe(GITHUB_LINK)
  })
})
