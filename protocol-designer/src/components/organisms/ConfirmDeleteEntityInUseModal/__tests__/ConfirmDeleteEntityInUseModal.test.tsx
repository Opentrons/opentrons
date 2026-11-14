import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConfirmDeleteEntityInUseModal } from '..'

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

  it('renders the text and buttons work as expected for clear', async () => {
    const user = userEvent.setup()
    props = {
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    }
    render(props)
    screen.getByText('Are you sure you want to clear slot?')
    screen.getByText(
      'This slot contains hardware or labware used in a protocol step, and clearing it may cause errors in your protocol.'
    )
    await user.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
    await user.click(screen.getByText('Clear slot'))
    expect(props.onConfirm).toHaveBeenCalled()
  })
})
