import 'jest-styled-components'
import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import {
  renderWithProviders,
  LEGACY_COLORS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { SubmitPrimaryButton } from '..'

const mockOnClick = jest.fn()

const render = (props: React.ComponentProps<typeof SubmitPrimaryButton>) => {
  return renderWithProviders(<SubmitPrimaryButton {...props} />)[0]
}

describe('SubmitPrimaryButton', () => {
  let props: React.ComponentProps<typeof SubmitPrimaryButton>

  beforeEach(() => {
    props = {
      form: 'mockForm',
      value: 'submit primary button',
      onClick: mockOnClick,
      disabled: false,
    }
  })

  it('renders submit primary button with text', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.blue50)}`
    )
    expect(button).toHaveStyle(
      `border-radius: ${String(BORDERS.radiusSoftCorners)}`
    )
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing16}`
    )
    expect(button).toHaveStyle(`color: ${String(COLORS.white)}`)
    expect(button).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSizeP)}`)
    expect(button).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(button).toHaveStyle(
      `line-height: ${String(TYPOGRAPHY.lineHeight20)}`
    )
    expect(button).toHaveStyle('width: 100%')
    expect(button).toHaveStyle('border: none')
    expect(button).toHaveAttribute('form', 'mockForm')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('renders secondary tertiary button with text and disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toBeDisabled()
    expect(button).toHaveStyle(
      `background-color: ${String(COLORS.grey50Disabled)}`
    )
    expect(button).toHaveStyle(
      `color: ${String(LEGACY_COLORS.successDisabled)}`
    )
  })

  it('calls mock function when clicking the button', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })

  it('applies the correct states to the button - hover', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.blue55)}`,
      {
        modifier: ':hover',
      }
    )
    expect(button).toHaveStyleRule('box-shadow', '0 0 0', {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - active', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${String(COLORS.blue60)}`,
      {
        modifier: ':active',
      }
    )
  })

  it('applies the correct states to the button - focus-visible', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.yellow50)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})
