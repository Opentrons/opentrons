import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { Ot2ProtocolModal } from '..'

import type { ComponentProps } from 'react'

const mockOnClose = vi.fn()
const mockOnOpenOt2Designer = vi.fn()

const render = (props: ComponentProps<typeof Ot2ProtocolModal>) => {
  return renderWithProviders(<Ot2ProtocolModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Ot2ProtocolModal', () => {
  let props: ComponentProps<typeof Ot2ProtocolModal>

  beforeEach(() => {
    props = {
      onClose: mockOnClose,
      onOpenOt2Designer: mockOnOpenOt2Designer,
    }
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('OT-2 protocol detected')
    screen.getByText(
      'This protocol is for the OT-2. Import and edit it in OT-2 Protocol Designer.'
    )
    screen.getByRole('button', { name: 'Cancel' })
    screen.getByRole('button', { name: 'Open OT-2 Protocol Designer' })
  })

  it('should call mock function when clicking cancel', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call mock function when clicking open ot-2 protocol designer', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open OT-2 Protocol Designer' })
    )
    expect(mockOnOpenOt2Designer).toHaveBeenCalled()
  })
})
