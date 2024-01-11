import 'jest-styled-components'
import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../../styles'
import { renderWithProviders } from '../../../testing/utils'
import { LEGACY_COLORS, TYPOGRAPHY, SPACING } from '../../../ui-style-constants'
import { COLORS } from '../../../helix-design-system'

import { CheckboxField } from '..'

const render = (props: React.ComponentProps<typeof CheckboxField>) => {
  return renderWithProviders(<CheckboxField {...props} />)[0]
}

describe('CheckboxField', () => {
  let props: React.ComponentProps<typeof CheckboxField>

  beforeEach(() => {
    props = {
      onChange: jest.fn(),
      value: false,
      name: 'mockCheckboxField',
      label: 'checkMockCheckboxField',
      disabled: false,
      isIndeterminate: false,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders label with correct style', () => {
    const { getByTestId, getByRole, getByText } = render(props)
    const checkBoxInput = getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    const checkBoxFieldBox = getByText('checkMockCheckboxField')
    const checkBoxIcon = getByTestId('CheckboxField_icon')

    // INNER_STYLE_NO_VALUE
    expect(checkBoxIcon).toHaveStyle(`width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(
      `color: ${String(LEGACY_COLORS.darkGreyEnabled)}`
    )
    expect(checkBoxIcon).toHaveStyle(`display: flex`)
    expect(checkBoxIcon).toHaveStyle(`border-radius: 1px`)
    expect(checkBoxIcon).toHaveStyle(
      `justify-content: ${String(JUSTIFY_CENTER)}`
    )
    expect(checkBoxIcon).toHaveStyle(`align-items: ${String(ALIGN_CENTER)}`)
    expect(checkBoxIcon).toHaveStyleRule('cursor', 'pointer', {
      modifier: ':hover',
    })
    expect(checkBoxIcon).toHaveStyleRule(
      'color',
      `${String(LEGACY_COLORS.darkGreyHover)}`,
      {
        modifier: ':hover',
      }
    )
    expect(checkBoxIcon).toHaveStyleRule(
      'color',
      `${String(LEGACY_COLORS.darkGreyPressed)}`,
      {
        modifier: ':active',
      }
    )
    expect(checkBoxIcon).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.blue50)}`,
      { modifier: ':focus' }
    )
    expect(checkBoxIcon).toHaveStyleRule(
      'color',
      `${String(LEGACY_COLORS.darkGreyPressed)}`,
      {
        modifier: ':disabled',
      }
    )

    // TODO: kj 09/15/2022 This part will be update later OUTER_STYLE
    // const checkBoxLabel = getByTestId('CheckboxField_label')
    // expect(checkBoxLabel).toHaveStyle('@apply --font-form-default')
    // expect(checkBoxLabel).toHaveStyle('font-size: 0.75rem')
    // expect(checkBoxLabel).toHaveStyle('font-weight: 400')
    // expect(checkBoxLabel).toHaveStyle(`color: ${COLORS.black90}`)
    // expect(checkBoxLabel).toHaveStyle('display: flex')
    // expect(checkBoxLabel).toHaveStyle(`align-items: ${ALIGN_CENTER}`)
    // expect(checkBoxLabel).toHaveStyle('line-height: 1')

    // INPUT_STYLE
    expect(checkBoxInput).toHaveStyle(`position: absolute`)
    expect(checkBoxInput).toHaveStyle(`overflow: hidden`)
    expect(checkBoxInput).toHaveStyle(`clip: rect(0 0 0 0)`)
    expect(checkBoxInput).toHaveStyle(`height: 1px`)
    expect(checkBoxInput).toHaveStyle(`width: 1px`)
    expect(checkBoxInput).toHaveStyle(`margin: -1px`)
    expect(checkBoxInput).toHaveStyle(`padding: 0`)
    expect(checkBoxInput).toHaveStyle(`border: 0`)
    expect(checkBoxInput).toHaveAttribute('tabindex', '0')

    // LABEL_TEXT_STYLE
    expect(checkBoxFieldBox).toHaveStyle(
      `font-size: ${String(TYPOGRAPHY.fontSizeP)}`
    )
    expect(checkBoxFieldBox).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(checkBoxFieldBox).toHaveStyle(`color: ${String(COLORS.black90)}`)
    expect(checkBoxFieldBox).toHaveStyle(`flex: 0 0 auto`)
    expect(checkBoxFieldBox).toHaveStyle(
      `padding: ${SPACING.spacing8} ${SPACING.spacing8}`
    )
    expect(checkBoxFieldBox).toHaveStyleRule('padding', '0', {
      modifier: ':empty',
    })
    expect(checkBoxFieldBox).toHaveAttribute('tabindex', '0')
  })

  it('render icon with correct style - value true', () => {
    props.value = true
    const { getByTestId } = render(props)
    const checkBoxIcon = getByTestId('CheckboxField_icon')
    expect(checkBoxIcon).toHaveStyle(`width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(
      `color: ${String(LEGACY_COLORS.blueEnabled)}`
    )
    expect(checkBoxIcon).toHaveStyle(`display: flex`)
    expect(checkBoxIcon).toHaveStyle(`border-radius: 1px`)
    expect(checkBoxIcon).toHaveStyle(
      `justify-content: ${String(JUSTIFY_CENTER)}`
    )
    expect(checkBoxIcon).toHaveStyle(`align-items: ${String(ALIGN_CENTER)}`)
  })

  it('renders label with correct style - value undefine', () => {
    props.value = undefined
    const { getByTestId } = render(props)
    const checkBoxIcon = getByTestId('CheckboxField_icon')
    expect(checkBoxIcon).toHaveStyle(`width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(
      `color: ${String(LEGACY_COLORS.darkGreyEnabled)}`
    )
    expect(checkBoxIcon).toHaveStyle(`display: flex`)
    expect(checkBoxIcon).toHaveStyle(`border-radius: 1px`)
    expect(checkBoxIcon).toHaveStyle(
      `justify-content: ${String(JUSTIFY_CENTER)}`
    )
    expect(checkBoxIcon).toHaveStyle(`align-items: ${String(ALIGN_CENTER)}`)
  })

  it('renders label with correct style - disabled true', () => {
    props.disabled = true
    const { getByRole } = render(props)
    const checkBoxInput = getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    expect(checkBoxInput).toBeDisabled()
  })

  it('renders label with correct style - tabIndex 1', () => {
    props.tabIndex = 1
    const { getByRole, getByText } = render(props)
    const checkBoxInput = getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    const checkBoxFieldBox = getByText('checkMockCheckboxField')
    expect(checkBoxInput).toHaveAttribute('tabindex', '1')
    expect(checkBoxFieldBox).toHaveAttribute('tabindex', '1')
  })

  it('calls mock function when clicking checkboxfield', () => {
    const { getByRole } = render(props)
    const checkBoxInput = getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    fireEvent.click(checkBoxInput)
    expect(props.onChange).toHaveBeenCalled()
  })
})
