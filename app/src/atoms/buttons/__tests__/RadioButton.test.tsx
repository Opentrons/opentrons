import * as React from 'react'
import { renderWithProviders, COLORS, SPACING } from '@opentrons/components'

import { RadioButton } from '..'

const render = (props: React.ComponentProps<typeof RadioButton>) => {
  return renderWithProviders(<RadioButton {...props} />)[0]
}

describe('RadioButton', () => {
  let props: React.ComponentProps<typeof RadioButton>
  beforeEach(() => {
    props = {
      onChange: jest.fn(),
      buttonLabel: 'radio button',
      buttonValue: 1,
    }
  })
  it('renders the large button', () => {
    props = {
      ...props,
      radioButtonType: 'large',
    }
    const { getByRole } = render(props)
    const label = getByRole('label')
<<<<<<< HEAD
    expect(label).toHaveStyle(`background-color: ${COLORS.blue35}`)
=======
    expect(label).toHaveStyle(`background-color: ${COLORS.mediumBlueEnabled}`)
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    expect(label).toHaveStyle(`padding: ${SPACING.spacing24}`)
  })
  it('renders the large selected button', () => {
    props = {
      ...props,
      isSelected: true,
      radioButtonType: 'large',
    }
    const { getByRole } = render(props)
    const label = getByRole('label')
<<<<<<< HEAD
    expect(label).toHaveStyle(`background-color: ${COLORS.blue50}`)
=======
    expect(label).toHaveStyle(`background-color: ${COLORS.blueEnabled}`)
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    expect(label).toHaveStyle(`padding: ${SPACING.spacing24}`)
  })
  it('renders the small button', () => {
    props = {
      ...props,
      radioButtonType: 'small',
    }
    const { getByRole } = render(props)
    const label = getByRole('label')
<<<<<<< HEAD
    expect(label).toHaveStyle(`background-color: ${COLORS.blue35}`)
=======
    expect(label).toHaveStyle(`background-color: ${COLORS.mediumBlueEnabled}`)
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    expect(label).toHaveStyle(`padding: ${SPACING.spacing20}`)
  })
  it('renders the small selected button', () => {
    props = {
      ...props,
      isSelected: true,
      radioButtonType: 'small',
    }
    const { getByRole } = render(props)
    const label = getByRole('label')
<<<<<<< HEAD
    expect(label).toHaveStyle(`background-color: ${COLORS.blue50}`)
=======
    expect(label).toHaveStyle(`background-color: ${COLORS.blueEnabled}`)
>>>>>>> 2524ab95c98ff696e637a42d46ea6a893c63f735
    expect(label).toHaveStyle(`padding: ${SPACING.spacing20}`)
  })
})
