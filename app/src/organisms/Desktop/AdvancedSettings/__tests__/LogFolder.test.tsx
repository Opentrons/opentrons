import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { changeAuditLogDirectory, getAuditLogDirectory } from '/app/redux/audit'

import { LogFolder } from '../LogFolder'

vi.mock('/app/redux/audit')

const render = () => {
  return renderWithProviders(<LogFolder />, {
    i18nInstance: i18n,
  })
}

describe('LogFolder', () => {
  beforeEach(() => {
    vi.mocked(getAuditLogDirectory).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the log folder section with no folder selected', () => {
    render()
    screen.getByText('Default Downloads Folder')
    screen.getByText(
      'Select the folder where files and logs downloaded from the app should be saved by default.'
    )
    screen.getByText('Default Folder')
    screen.getByText('No folder selected')
    screen.getByRole('button', { name: 'Select folder' })
  })

  it('renders the log folder section with a folder selected', () => {
    vi.mocked(getAuditLogDirectory).mockReturnValue('/mock/audit-log-path')
    render()
    screen.getByText('Default Downloads Folder')
    screen.getByText(
      'Select the folder where files and logs downloaded from the app should be saved by default.'
    )
    screen.getByText('Default Folder')
    screen.getByText('/mock/audit-log-path')
    screen.getByRole('button', { name: 'Change folder' })
  })

  it('dispatches changeAuditLogDirectory when the button is clicked', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Select folder' }))
    expect(vi.mocked(changeAuditLogDirectory)).toHaveBeenCalled()
  })
})
