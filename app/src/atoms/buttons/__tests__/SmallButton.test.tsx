import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import {
  renderWithProviders,
  LEGACY_COLORS,
  BORDERS,
} from '@opentrons/components'

import { SmallButton } from '../SmallButton'

const render = (props: React.ComponentProps<typeof SmallButton>) => {
  return renderWithProviders(<SmallButton {...props} />)[0]
}

describe('SmallButton', () => {
  let props: React.ComponentProps<typeof SmallButton>

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      buttonText: 'small button',
    }
  })
  it('renders the primary button and it works as expected', () => {
    render(props)
    fireEvent.click(screen.getByText('small button'))
    expect(props.onClick).toHaveBeenCalled()
    expect(screen.getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.blue50}`
    )
    expect(screen.getByRole('button')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadiusSize4}`
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
      `background-color: ${COLORS.blue35}`
    )
  })
  it('renders the tertiary high light button', () => {
    props = {
      ...props,
      buttonType: 'tertiaryHighLight',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(`color: ${COLORS.black90}`)
  })
  it('renders the tertiary low light', () => {
    props = {
      ...props,
      buttonType: 'tertiaryLowLight',
    }
    render(props)
    expect(screen.getByRole('button')).toHaveStyle(
      `color: ${COLORS.black90}${LEGACY_COLORS.opacity70HexCode}`
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
  it('renders an icon with start placement', () => {
    props = {
      ...props,
      iconName: 'alert',
      iconPlacement: 'startIcon',
    }
    render(props)
    screen.getByLabelText('alert')
  })
  it('renders an icon with end placement', () => {
    props = {
      ...props,
      iconName: 'alert',
      iconPlacement: 'endIcon',
    }
    render(props)
    screen.getByLabelText('alert')
  })
})
