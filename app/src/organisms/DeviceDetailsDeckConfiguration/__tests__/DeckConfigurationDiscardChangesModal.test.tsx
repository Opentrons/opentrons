import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { DeckConfigurationDiscardChangesModal } from '../DeckConfigurationDiscardChangesModal'
import type { useHistory } from 'react-router-dom'

const mockFunc = vi.fn()
const mockGoBack = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ goBack: mockGoBack }),
  }
})

const render = (
  props: React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>
) => {
  return renderWithProviders(
    <DeckConfigurationDiscardChangesModal {...props} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeckConfigurationDiscardChangesModal', () => {
  let props: React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>

  beforeEach(() => {
    props = {
      setShowConfirmationModal: mockFunc,
    }
  })
  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Changes will be lost')
    screen.getByText(
      'Are you sure you want to exit without saving your deck configuration?'
    )
    screen.getByText('Discard changes')
    screen.getByText('Continue editing')
  })

  it('should call a mock function when tapping discard changes button', () => {
    render(props)
    fireEvent.click(screen.getByText('Discard changes'))
    expect(mockFunc).toHaveBeenCalledWith(false)
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('should call a mock function when tapping continue editing button', () => {
    render(props)
    fireEvent.click(screen.getByText('Continue editing'))
    expect(mockFunc).toHaveBeenCalledWith(false)
  })
})
