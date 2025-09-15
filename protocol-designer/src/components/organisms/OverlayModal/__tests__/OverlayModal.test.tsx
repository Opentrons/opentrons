import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { removeHint } from '/protocol-designer/tutorial/actions'

import { useOverlayModal, OverlayModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/tutorial/actions')

const render = (props: ComponentProps<typeof OverlayModal>) => {
  return renderWithProviders(<OverlayModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('BlockingHintModal', () => {
  let props: ComponentProps<typeof OverlayModal>

  beforeEach(() => {
    props = {
      header: 'header',
      subText: 'subText',
      children: <div>mock content</div>,
      handleCancel: vi.fn(),
      handleContinue: vi.fn(),
    }
  })
  it('renders the hint with buttons and checkbox', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.handleCancel).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(props.handleContinue).toHaveBeenCalled()
    expect(vi.mocked(removeHint)).toHaveBeenCalled()
    screen.getByText('mock content')
  })
})
