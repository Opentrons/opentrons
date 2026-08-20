import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DocumentationRequired } from '../DocumentationRequired'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DocumentationRequired>) =>
  renderWithProviders(
    <NiceModal.Provider>
      <DocumentationRequired {...props} />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )

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
      onBack: vi.fn(),
      minReportLength: 10,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders header, the per-user note label, and the confirm + back buttons', () => {
    render(props)
    screen.getByText('Documentation required for robot action')
    screen.getByText('Note for robot audit log by alice')
    screen.getByRole('button', { name: 'Confirm' })
    screen.getByRole('button', { name: 'Back to previous page' })
  })

  it('keeps the confirm button enabled even when the note is empty', () => {
    render(props)
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled()
  })

  it('calls onConfirm with the trimmed note when confirm is clicked', () => {
    render(props)
    editNote('  starting QC run  ')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(props.onConfirm).toHaveBeenCalledWith('starting QC run')
  })

  it('shows a required error and does not confirm when the note is empty', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(props.onConfirm).not.toHaveBeenCalled()
    screen.getByText('Documentation is required')
  })

  it('treats whitespace-only input as empty and shows a required error', () => {
    render(props)
    editNote('   \n\t  ')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(props.onConfirm).not.toHaveBeenCalled()
    screen.getByText('Documentation is required')
  })

  it('clears the required error when the user edits the note', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    screen.getByText('Documentation is required')

    editNote('starting QC run')

    expect(
      screen.queryByText('Documentation is required')
    ).not.toBeInTheDocument()
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

  it('calls onBack when the back button is clicked', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Back to previous page' })
    )
    expect(props.onBack).toHaveBeenCalledOnce()
  })

  it('shows the actions view when the view actions button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Secondary_Button'))
    screen.getByText('Actions requiring documentation')
  })
})
