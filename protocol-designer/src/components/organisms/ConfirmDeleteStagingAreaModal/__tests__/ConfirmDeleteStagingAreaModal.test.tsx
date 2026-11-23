import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConfirmDeleteStagingAreaModal } from '..'

import type { ComponentProps } from 'react'

const render = (
  props: ComponentProps<typeof ConfirmDeleteStagingAreaModal>
) => {
  return renderWithProviders(<ConfirmDeleteStagingAreaModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfirmDeleteStagingAreaModal', () => {
  let props: ComponentProps<typeof ConfirmDeleteStagingAreaModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    }
  })

  it('renders the text and buttons work as expected', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('This staging area slot has labware')
    screen.getByText(
      'The staging area slot that you are about to delete has labware placed on it. If you make these changes to your protocol starting deck, the labware will be deleted as well.'
    )
    await user.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
    await user.click(screen.getByText('Continue'))
    expect(props.onConfirm).toHaveBeenCalled()
  })
})
