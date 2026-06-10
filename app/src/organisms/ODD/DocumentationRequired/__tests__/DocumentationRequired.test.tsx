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
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders header, the per-user note label, and the confirm + back buttons', () => {
    render(props)
    screen.getByText('Documentation Required')
    screen.getByText('Note for robot audit log by alice')
    screen.getByRole('button', { name: 'Confirm' })
    screen.getByRole('button', { name: 'Back to previous page' })
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
