import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COLORS, SPACING } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

import { RadioButton } from '..'
import { screen } from '@testing-library/react'

const render = (props: React.ComponentProps<typeof RadioButton>) => {
  return renderWithProviders(<RadioButton {...props} />)[0]
}

describe('RadioButton', () => {
  let props: React.ComponentProps<typeof RadioButton>
  beforeEach(() => {
    props = {
      onChange: vi.fn(),
      buttonLabel: 'radio button',
      buttonValue: 1,
    }
  })
  it('renders the large button', () => {
    props = {
      ...props,
      radioButtonType: 'large',
    }
    render(props)
    const label = screen.getByRole('label')
    expect(label).toHaveStyle(`background-color: ${COLORS.blue35}`)
    expect(label).toHaveStyle(`padding: ${SPACING.spacing24}`)
  })
  it('renders the large selected button', () => {
    props = {
      ...props,
      isSelected: true,
      radioButtonType: 'large',
    }
    render(props)
    const label = screen.getByRole('label')
    expect(label).toHaveStyle(`background-color: ${COLORS.blue50}`)
    expect(label).toHaveStyle(`padding: ${SPACING.spacing24}`)
  })
  it('renders the small button', () => {
    props = {
      ...props,
      radioButtonType: 'small',
    }
    render(props)
    const label = screen.getByRole('label')
    expect(label).toHaveStyle(`background-color: ${COLORS.blue35}`)
    expect(label).toHaveStyle(`padding: ${SPACING.spacing20}`)
  })
  it('renders the small selected button', () => {
    props = {
      ...props,
      isSelected: true,
      radioButtonType: 'small',
    }
    render(props)
    const label = screen.getByRole('label')
    expect(label).toHaveStyle(`background-color: ${COLORS.blue50}`)
    expect(label).toHaveStyle(`padding: ${SPACING.spacing20}`)
  })
})
