import { i18n } from '../../../../../i18n'
import { mockReachableRobot } from '../../../../../redux/discovery/__fixtures__'
import { getShellUpdateState } from '../../../../../redux/shell'
import type { ShellUpdateState } from '../../../../../redux/shell/types'
import { useRobot } from '../../../hooks'
import { SoftwareUpdateModal } from '../SoftwareUpdateModal'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../../../../../redux/shell/update', () => ({
  ...jest.requireActual<{}>('../../../../../redux/shell/update'),
  getShellUpdateState: jest.fn(),
}))
jest.mock('../../../hooks')
jest.mock('../../../../../redux/discovery/selectors')

const mockClose = jest.fn()

const mockGetShellUpdateState = getShellUpdateState as jest.MockedFunction<
  typeof getShellUpdateState
>

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <SoftwareUpdateModal
        robotName={mockReachableRobot.name}
        closeModal={mockClose}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings SoftwareUpdateModal', () => {
  beforeEach(() => {
    mockUseRobot.mockReturnValue(mockReachableRobot)
    mockGetShellUpdateState.mockReturnValue({
      downloaded: true,
      info: {
        version: '1.2.3',
        releaseNotes: 'this is a release',
      },
    } as ShellUpdateState)
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  it('should render title ,description and button', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Robot Update Available')
    getByText('Updating the robot’s software requires restarting the robot')
    getByText('App Changes in 1.2.3')
    getByText('New Features')
    getByText('Bug Fixes')
    getByText('View Opentrons technical change log')
    getByText('View Opentrons issue tracker')
    getByText('View full Opentrons release notes')
    getByRole('button', { name: 'Remind me later' })
    getByRole('button', { name: 'Update robot now' })
  })

  it('should have correct href', () => {
    const [{ getByRole }] = render()
    const changeLogUrl =
      'https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md'
    const issueTrackerUrl =
      'https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug'
    const releaseNotesUrl = 'https://github.com/Opentrons/opentrons/releases'

    const linkForChangeLog = getByRole('link', {
      name: 'View Opentrons technical change log',
    })
    expect(linkForChangeLog).toHaveAttribute('href', changeLogUrl)

    const linkForIssueTracker = getByRole('link', {
      name: 'View Opentrons issue tracker',
    })
    expect(linkForIssueTracker.closest('a')).toHaveAttribute(
      'href',
      issueTrackerUrl
    )

    const linkForReleaseNotes = getByRole('link', {
      name: 'View full Opentrons release notes',
    })
    expect(linkForReleaseNotes.closest('a')).toHaveAttribute(
      'href',
      releaseNotesUrl
    )
  })
})
