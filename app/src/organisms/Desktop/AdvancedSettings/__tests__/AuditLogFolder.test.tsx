import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  changeAuditLogDirectory,
  getAuditLogDirectory,
} from '/app/redux/log-location'

import { AuditLogFolder } from '../AuditLogFolder'

vi.mock('/app/redux/log-location')

const render = () => {
  return renderWithProviders(<AuditLogFolder />, {
    i18nInstance: i18n,
  })
}

describe('AuditLogFolder', () => {
  beforeEach(() => {
    vi.mocked(getAuditLogDirectory).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the audit log folder section with no folder selected', () => {
    render()
    expect(screen.getAllByText('Audit Log Folder')).toHaveLength(2)
    screen.getByText(
      'If you want to specify a folder to save audit logs into, you can add the directory here.'
    )
    screen.getByText('No audit log folder selected')
    screen.getByRole('button', { name: 'Select folder' })
  })

  it('renders the audit log folder section with a folder selected', () => {
    vi.mocked(getAuditLogDirectory).mockReturnValue('/mock/audit-log-path')
    render()
    expect(screen.getAllByText('Audit Log Folder')).toHaveLength(2)
    screen.getByText(
      'If you want to specify a folder to save audit logs into, you can add the directory here.'
    )
    screen.getByText('/mock/audit-log-path')
    screen.getByRole('button', { name: 'Change folder' })
  })

  it('dispatches changeAuditLogDirectory when the button is clicked', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Select folder' }))
    expect(vi.mocked(changeAuditLogDirectory)).toHaveBeenCalled()
  })
})
