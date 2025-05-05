import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDeleteEntityInUseModal } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

import type { ComponentProps } from 'react'

const render = (
  props: ComponentProps<typeof ConfirmDeleteEntityInUseModal>
) => {
  return renderWithProviders(<ConfirmDeleteEntityInUseModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmDeleteEntityInUseModal', () => {
  let props: ComponentProps<typeof ConfirmDeleteEntityInUseModal>
  it('renders the text and buttons work as expected for clear', () => {
    props = {
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    }
    render(props)
    screen.getByText('Are you sure you want to clear slot?')
    screen.getByText(
      'This slot contains hardware or labware used in a protocol step, and clearing it may cause errors in your protocol.'
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Clear slot'))
    expect(props.onConfirm).toHaveBeenCalled()
  })
})
