import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'

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
    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.red_two}`
    )
  })
  it('renders the secondary button', () => {
    props = {
      ...props,
      buttonType: 'secondary',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.foundationalBlue}`
    )
  })
  it('renders the secondary alert button', () => {
    props = {
      ...props,
      buttonType: 'alertSecondary',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.red_three}`
    )
  })
  it('renders the tertiary button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryHigh',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.white}`)
  })
  it('renders the tertiary light button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryHighLight',
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
})
