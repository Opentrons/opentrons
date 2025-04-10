import { describe, it, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectPipettePath } from '../SelectPipettePath'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectPipettePath>) => {
  return renderWithProviders(<SelectPipettePath {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectPipettePath', () => {
  let props: ComponentProps<typeof SelectPipettePath>

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
    screen.getByText('Select pipette path')
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
