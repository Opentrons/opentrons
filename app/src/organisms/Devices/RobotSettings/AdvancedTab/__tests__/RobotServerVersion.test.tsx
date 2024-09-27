import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getRobotApiVersion } from '/app/redux/discovery'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { handleUpdateBuildroot } from '../../UpdateBuildroot'
import { RobotServerVersion } from '../RobotServerVersion'
import { useRobot } from '/app/redux-resources/robots'

vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/robot-update/selectors')
vi.mock('/app/redux/discovery/selectors')
vi.mock('../../UpdateBuildroot')

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
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    vi.mocked(getRobotApiVersion).mockReturnValue(MOCK_ROBOT_VERSION)
  })

  it('should render title and description', () => {
    render()
    screen.getByText('Robot Server Version')
    screen.getByText('View latest release notes on')
    screen.getByText('v7.7.7')
  })

  it('should render the message, up to date, if the robot server version is the same as the latest version', () => {
    render()
    screen.getByText('up to date')
    const reinstall = screen.getByRole('button', { name: 'reinstall' })
    fireEvent.click(reinstall)
    expect(handleUpdateBuildroot).toHaveBeenCalled()
  })

  it('should render the warning message if the robot server version needs to upgrade', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    render()
    screen.getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    const btn = screen.getByText('View update')
    fireEvent.click(btn)
    expect(handleUpdateBuildroot).toHaveBeenCalled()
  })

  it('should render the warning message if the robot server version needs to downgrade', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'downgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    render()
    screen.getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    const btn = screen.getByText('View update')
    fireEvent.click(btn)
    expect(handleUpdateBuildroot).toHaveBeenCalled()
  })

  it('the link should have the correct href', () => {
    render()
    const GITHUB_LINK =
      'https://github.com/Opentrons/opentrons/blob/edge/api/release-notes.md'
    const githubLink = screen.getByText('GitHub')
    expect(githubLink.getAttribute('href')).toBe(GITHUB_LINK)
  })
})
