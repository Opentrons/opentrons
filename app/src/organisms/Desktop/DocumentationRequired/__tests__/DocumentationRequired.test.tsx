import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DocumentationRequired } from '../DocumentationRequired'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DocumentationRequired>) =>
  renderWithProviders(<DocumentationRequired {...props} />, {
    i18nInstance: i18n,
  })

const editNote = (value: string): void => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } })
}

describe('DocumentationRequired', () => {
  let props: ComponentProps<typeof DocumentationRequired>

  beforeEach(() => {
    props = {
      username: 'alice',
      actionsToDocument: [],
      onConfirm: vi.fn(),
      onClose: vi.fn(),
      minReportLength: 10,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders header, the per-user note label, action list, and the confirm + cancel buttons', () => {
    render(props)
    screen.getByText('Documentation Required')
    screen.getByText('Note for robot audit log by alice')
    screen.getByText('Action list')
    screen.getByRole('button', { name: 'Confirm' })
    screen.getByRole('button', { name: 'Cancel action' })
  })

  it('keeps the confirm button disabled until a non-empty note is entered', () => {
    render(props)
    const confirm = screen.getByRole('button', { name: 'Confirm' })
    expect(confirm).toBeDisabled()

    editNote('starting QC run')

    expect(confirm).toBeEnabled()
  })

  it('treats whitespace-only input as empty and keeps confirm disabled', () => {
    render(props)
    editNote('   \n\t  ')

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  it('calls onConfirm with the trimmed note when confirm is clicked', () => {
    render(props)
    editNote('  starting QC run  ')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(props.onConfirm).toHaveBeenCalledWith('starting QC run')
  })

  it('does not call onConfirm when the note is empty', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  it('shows a min-length error and does not confirm when the note is too short', () => {
    render(props)
    editNote('too short')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(props.onConfirm).not.toHaveBeenCalled()
    screen.getByText('Must be at least 10 characters long')
  })

  it('clears the min-length error when the user edits the note', () => {
    render(props)
    editNote('too short')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    screen.getByText('Must be at least 10 characters long')

    editNote('long enough note')

    expect(
      screen.queryByText('Must be at least 10 characters long')
    ).not.toBeInTheDocument()
  })

  it('calls onClose when the cancel button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel action' }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })
})
