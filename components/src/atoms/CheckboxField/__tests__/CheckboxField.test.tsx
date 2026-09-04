import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { CheckboxField } from '..'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../../styles'
import { renderWithProviders } from '../../../testing/utils'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof CheckboxField>) => {
  return renderWithProviders(<CheckboxField {...props} />)[0]
}

describe('CheckboxField', () => {
  let props: ComponentProps<typeof CheckboxField>

  beforeEach(() => {
    props = {
      onChange: vi.fn(),
      value: false,
      name: 'mockCheckboxField',
      label: 'checkMockCheckboxField',
      disabled: false,
      isIndeterminate: false,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders label with correct style', () => {
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    const checkBoxFieldBox = screen.getByText('checkMockCheckboxField')
    const checkBoxIcon = screen.getByTestId('CheckboxField_icon')

    // INNER_STYLE_NO_VALUE
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`color: ${COLORS.grey50}`)
    expect(checkBoxIcon).toHaveStyle(`display: flex`)

    expect(checkBoxIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius2}`)
    expect(checkBoxIcon).toHaveStyle(`justify-content: ${JUSTIFY_CENTER}`)
    expect(checkBoxIcon).toHaveStyle(`align-items: ${ALIGN_CENTER}`)

    // INPUT_STYLE
    expect(checkBoxInput).toHaveStyle(`position: absolute`)
    expect(checkBoxInput).toHaveStyle(`overflow: hidden`)
    expect(checkBoxInput).toHaveStyle(`clip-path: inset(50%)`)
    expect(checkBoxInput).toHaveStyle(`height: 1px`)
    expect(checkBoxInput).toHaveStyle(`width: 1px`)
    expect(checkBoxInput).toHaveStyle(`margin: -1px`)
    expect(checkBoxInput).toHaveStyle(`padding: 0`)
    expect(checkBoxInput).toHaveStyle(`border-width: 0`)
    expect(checkBoxInput).toHaveAttribute('tabindex', '0')

    // LABEL_TEXT_STYLE
    expect(checkBoxFieldBox).toHaveStyle(`font-size: ${TYPOGRAPHY.fontSizeH3}`)
    expect(checkBoxFieldBox).toHaveStyle(
      `font-weight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(checkBoxFieldBox).toHaveStyle(`color: ${COLORS.black90}`)
    expect(checkBoxFieldBox).toHaveStyle(`flex: 0 0 auto`)
    expect(checkBoxFieldBox).toHaveStyle(`padding: ${SPACING.spacing8}`)
  })

  it('applies correct padding when padding prop is passed', () => {
    props.padding = SPACING.spacing24
    render(props)
    const checkBoxFieldBox = screen.getByText('checkMockCheckboxField')
    expect(checkBoxFieldBox).toHaveStyle(`padding: ${SPACING.spacing24}`)
  })

  it('render icon with correct style - value true', () => {
    props.value = true
    render(props)
    const checkBoxIcon = screen.getByTestId('CheckboxField_icon')
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`color: ${COLORS.blue50}`)
    expect(checkBoxIcon).toHaveStyle(`display: flex`)
    expect(checkBoxIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius2}`)
    expect(checkBoxIcon).toHaveStyle(`justify-content: ${JUSTIFY_CENTER}`)
    expect(checkBoxIcon).toHaveStyle(`align-items: ${ALIGN_CENTER}`)
  })

  it('renders label with correct style - value undefined', () => {
    props.value = undefined
    render(props)
    const checkBoxIcon = screen.getByTestId('CheckboxField_icon')
    expect(checkBoxIcon).toHaveStyle(`min-width: 1.25rem`)
    expect(checkBoxIcon).toHaveStyle(`color: ${COLORS.grey50}`)
    expect(checkBoxIcon).toHaveStyle(`display: flex`)
    expect(checkBoxIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius2}`)
    expect(checkBoxIcon).toHaveStyle(`justify-content: ${JUSTIFY_CENTER}`)
    expect(checkBoxIcon).toHaveStyle(`align-items: ${ALIGN_CENTER}`)
  })

  it('renders label with correct style - disabled true', () => {
    props.disabled = true
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    expect(checkBoxInput).toBeDisabled()
  })

  it('renders label with correct style - tabIndex 1', () => {
    props.tabIndex = 1
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    expect(checkBoxInput).toHaveAttribute('tabindex', '1')
  })

  it('calls mock function when clicking checkboxfield', () => {
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'checkMockCheckboxField',
    })
    fireEvent.click(checkBoxInput)
    expect(props.onChange).toHaveBeenCalled()
  })
})
