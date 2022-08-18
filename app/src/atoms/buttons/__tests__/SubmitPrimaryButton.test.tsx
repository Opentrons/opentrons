import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import {
  renderWithProviders,
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

  afterEach(() => {
    mockOnClick.mockClear()
  })

  it('renders submit primary button with text', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyle(`background-color: ${COLORS.blueEnabled}`)
    expect(button).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(button).toHaveStyle(
      `padding: ${SPACING.spacing3} ${SPACING.spacing4}`
    )
    expect(button).toHaveStyle(`color: ${COLORS.white}`)
    expect(button).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeP}`)
    expect(button).toHaveStyle(`font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`)
    expect(button).toHaveStyle(`line-height: ${TYPOGRAPHY.lineHeight20}`)
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
    expect(button).toHaveStyle(`background-color: ${COLORS.darkGreyDisabled}`)
    expect(button).toHaveStyle(`color: ${COLORS.successDisabled}`)
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
    expect(button).toHaveStyleRule('background-color', `${COLORS.blueHover}`, {
      modifier: ':hover',
    })
    expect(button).toHaveStyleRule('box-shadow', '0 0 0', {
      modifier: ':hover',
    })
  })

  it('applies the correct states to the button - active', () => {
    const { getByText } = render(props)
    const button = getByText('submit primary button')
    expect(button).toHaveStyleRule(
      'background-color',
      `${COLORS.bluePressed}`,
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
      `0 0 0 3px ${COLORS.warningEnabled}`,
      {
        modifier: ':focus-visible',
      }
    )
  })
})
