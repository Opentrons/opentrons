import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getRobotApiVersion } from '../../../../../redux/discovery'
import { getRobotUpdateDisplayInfo } from '../../../../../redux/robot-update'
import { mockConnectableRobot } from '../../../../../redux/discovery/__fixtures__'
import { useRobot } from '../../../hooks'
import { handleUpdateBuildroot } from '../../UpdateBuildroot'
import { RobotServerVersion } from '../RobotServerVersion'

vi.mock('../../../hooks')
vi.mock('../../../../../redux/robot-update/selectors')
vi.mock('../../../../../redux/discovery/selectors')
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
      'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'
    const githubLink = screen.getByText('GitHub')
    expect(githubLink.getAttribute('href')).toBe(GITHUB_LINK)
  })
})
