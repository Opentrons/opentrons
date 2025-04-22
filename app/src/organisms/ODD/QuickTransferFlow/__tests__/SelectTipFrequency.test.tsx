import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectTipFrequency } from '../SelectTipFrequency'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectTipFrequency>) => {
  return renderWithProviders(<SelectTipFrequency {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectTipFrequency', () => {
  let props: ComponentProps<typeof SelectTipFrequency>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {},
      dispatch: vi.fn(),
    }
  })

  it('renders text, exit button and continue button', () => {
    render(props)
    screen.getByText('Select change tip frequency')
    screen.getByText('Exit')
    screen.getByText('Continue')
  })

  it('should call mock function when tappin exit button', () => {
    render(props)
    fireEvent.click(screen.getByText('Exit'))
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
  })

  it('should call mock function when tappin continue button', () => {
    render(props)
    fireEvent.click(screen.getByText('Continue'))
    expect(props.onNext).toHaveBeenCalled()
  })
})
