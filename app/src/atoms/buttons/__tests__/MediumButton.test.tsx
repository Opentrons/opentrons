import * as React from 'react'
import { renderWithProviders, COLORS, BORDERS } from '@opentrons/components'

import { MediumButton } from '../MediumButton'

const render = (props: React.ComponentProps<typeof MediumButton>) => {
  return renderWithProviders(<MediumButton {...props} />)[0]
}

describe('MediumButton', () => {
  let props: React.ComponentProps<typeof MediumButton>
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      buttonType: 'primary',
      buttonText: 'Medium button',
    }
  })
  it('renders the default button and it works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('Medium button').click()
    expect(props.onClick).toHaveBeenCalled()
    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.blueEnabled}`
    )
  })
  it('renders the alert button', () => {
    props = {
      ...props,
      buttonType: 'alert',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.red2}`)
  })
  it('renders the secondary button', () => {
    props = {
      ...props,
      buttonType: 'secondary',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.mediumBlueEnabled}`
    )
  })
  it('renders the secondary alert button', () => {
    props = {
      ...props,
      buttonType: 'alertSecondary',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.red3}`)
  })
  it('renders the tertiary high button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryHigh',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.white}`)
  })
  it('renders the tertiary low light button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryLowLight',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.white}`)
  })
  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toBeDisabled()
  })
  it('renders custom icon in the button', () => {
    props = {
      ...props,
      iconName: 'restart',
    }
    const { getByLabelText } = render(props)
    getByLabelText('MediumButton_restart')
  })
  it('renders the rounded button category', () => {
    props = {
      ...props,
      buttonCategory: 'rounded',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadiusSize5}`
    )
  })
})
