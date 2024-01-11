import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import {
  renderWithProviders,
  LEGACY_COLORS,
  COLORS,
  BORDERS,
} from '@opentrons/components'

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
    render(props)
    fireEvent.click(screen.getByText('Medium button'))
    expect(props.onClick).toHaveBeenCalled()
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${LEGACY_COLORS.blueEnabled}`
    )
  })
  it('renders the alert button', () => {
    props = {
      ...props,
      buttonType: 'alert',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${LEGACY_COLORS.red2}`
    )
  })
  it('renders the secondary button', () => {
    props = {
      ...props,
      buttonType: 'secondary',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${LEGACY_COLORS.mediumBlueEnabled}`
    )
  })
  it('renders the secondary alert button', () => {
    props = {
      ...props,
      buttonType: 'alertSecondary',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${LEGACY_COLORS.red3}`
    )
  })
  it('renders the tertiary high button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryHigh',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
  it('renders the tertiary low light button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryLowLight',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  it('renders custom icon in the button', () => {
    props = {
      ...props,
      iconName: 'restart',
    }
    const { getByLabelText } = render(props)
    getByLabelText('restart icon')
  })
  it('renders the rounded button category', () => {
    props = {
      ...props,
      buttonCategory: 'rounded',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadiusSize5}`
    )
  })
})
