/* eslint-disable testing-library/no-node-access */
import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getShellUpdateState } from '../../../../../redux/shell'
import { useRobot } from '../../../hooks'
import { mockReachableRobot } from '../../../../../redux/discovery/__fixtures__'

import { SoftwareUpdateModal } from '../SoftwareUpdateModal'

import type { ShellUpdateState } from '../../../../../redux/shell/types'
import type * as ShellUpdate from '../../../../../redux/shell/update'

vi.mock('../../../../../redux/shell/update', async importOriginal => {
  const actual = await importOriginal<typeof ShellUpdate>()
  return {
    ...actual,
    getShellUpdateState: vi.fn(),
  }
})
vi.mock('../../../hooks')
vi.mock('../../../../../redux/discovery/selectors')

const mockClose = vi.fn()

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
    vi.mocked(useRobot).mockReturnValue(mockReachableRobot)
    vi.mocked(getShellUpdateState).mockReturnValue({
      downloaded: true,
      info: {
        version: '1.2.3',
        releaseNotes: 'this is a release',
      },
    } as ShellUpdateState)
  })

  it('should render title ,description and button', () => {
    render()
    screen.getByText('Robot Update Available')
    screen.getByText(
      'Updating the robot’s software requires restarting the robot'
    )
    screen.getByText('App Changes in 1.2.3')
    screen.getByText('New Features')
    screen.getByText('Bug Fixes')
    screen.getByText('View Opentrons technical change log')
    screen.getByText('View Opentrons issue tracker')
    screen.getByText('View full Opentrons release notes')
    screen.getByRole('button', { name: 'Remind me later' })
    screen.getByRole('button', { name: 'Update robot now' })
  })

  it('should have correct href', () => {
    render()
    const changeLogUrl =
      'https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md'
    const issueTrackerUrl =
      'https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug'
    const releaseNotesUrl = 'https://github.com/Opentrons/opentrons/releases'

    const linkForChangeLog = screen.getByRole('link', {
      name: 'View Opentrons technical change log',
    })
    expect(linkForChangeLog).toHaveAttribute('href', changeLogUrl)

    const linkForIssueTracker = screen.getByRole('link', {
      name: 'View Opentrons issue tracker',
    })
    expect(linkForIssueTracker.closest('a')).toHaveAttribute(
      'href',
      issueTrackerUrl
    )

    const linkForReleaseNotes = screen.getByRole('link', {
      name: 'View full Opentrons release notes',
    })
    expect(linkForReleaseNotes.closest('a')).toHaveAttribute(
      'href',
      releaseNotesUrl
    )
  })
})
