import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { FlexProtocolModal } from '..'

import type { ComponentProps } from 'react'

const mockOnClose = vi.fn()
const mockOnOpenFlexDesigner = vi.fn()

const render = (props: ComponentProps<typeof FlexProtocolModal>) => {
  return renderWithProviders(<FlexProtocolModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FlexProtocolModal', () => {
  let props: ComponentProps<typeof FlexProtocolModal>

  beforeEach(() => {
    props = {
      onClose: mockOnClose,
      onOpenFlexDesigner: mockOnOpenFlexDesigner,
    }
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Flex protocol detected')
    screen.getByText(
      'This protocol is for Opentrons Flex. Import and edit it in Protocol Designer.'
    )
    screen.getByRole('button', { name: 'Cancel' })
    screen.getByRole('button', { name: 'Open Protocol Designer' })
  })

  it('should call mock function when clicking cancel', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call mock function when clicking open protocol designer', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Protocol Designer' })
    )
    expect(mockOnOpenFlexDesigner).toHaveBeenCalled()
  })
})
