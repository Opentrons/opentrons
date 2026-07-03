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
  })

  it('renders selectedRuns copy', () => {
    render('selectedRuns')
    screen.getByText('Delete selected protocol run records?')
    screen.getByText(
      'Deleting the selected protocol run records will permanently remove them from the robot, along with all associated files. This action cannot be undone.'
    )
    screen.getByText(
      'We recommend downloading all protocol files before proceeding.'
    )
  })

  it('renders allLogs copy', () => {
    render('allLogs')
    screen.getByText('Delete all logs?')
    screen.getByText(
      'Deleting all logs will permanently remove them from the robot. This action cannot be undone.'
    )
    screen.getByText(
      'We recommend downloading all log files before proceeding.'
    )
  })
})
