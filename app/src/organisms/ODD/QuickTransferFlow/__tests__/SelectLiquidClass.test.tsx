import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SelectLiquidClass } from '../SelectLiquidClass'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SelectLiquidClass>) => {
  return renderWithProviders(<SelectLiquidClass {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectLiquidClass', () => {
  let props: ComponentProps<typeof SelectLiquidClass>

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
    screen.getByText('Select liquid class')
    screen.getByText(
      'Apply predefined settings for the type of liquid used in your transfer'
    )
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
