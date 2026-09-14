import { screen } from '@testing-library/react'
import { describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DeleteRecordsModal } from '..'

const render = (
  type: React.ComponentProps<typeof DeleteRecordsModal>['type']
) =>
  renderWithProviders(
    <DeleteRecordsModal type={type} onClose={vi.fn()} onConfirm={vi.fn()} />,
    { i18nInstance: i18n }
  )

describe('DeleteRecordsModal', () => {
  it('renders allRuns copy', () => {
    render('allRuns')
    screen.getByText('Delete all protocol run records?')
    screen.getByText(
      'Deleting all protocol run records will permanently remove them from the robot, along with all associated files. This action cannot be undone.'
    )
    screen.getByText(
      'We recommend downloading all protocol files before proceeding.'
    )
    screen.getByText('Delete all')
  })

  it('renders selectedRuns copy', () => {
    render('selectedRuns')
    screen.getByText('Download and delete selected protocol run records?')
    screen.getByText(
      'Download the selected protocol run records before continuing. Once downloaded, the files will be permanently deleted from the robot and cannot be recovered.'
    )
    screen.getByText('Download and delete all')
  })

  it('renders selectedLogs copy', () => {
    render('selectedLogs')
    screen.getByText('Download and delete all selected audit logs?')
    screen.getByText(
      'Download the robot’s audit logs before continuing. Once downloaded, the logs will be permanently deleted from the robot and cannot be recovered.'
    )
    screen.getByText('Download and delete all')
  })
})
