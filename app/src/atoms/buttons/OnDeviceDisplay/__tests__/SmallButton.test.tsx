import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'

import { SmallButton } from '../SmallButton'

const render = (props: React.ComponentProps<typeof SmallButton>) => {
  return renderWithProviders(<SmallButton {...props} />)[0]
}

describe('SmallButton', () => {
  let props: React.ComponentProps<typeof SmallButton>

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      buttonType: 'default',
      buttonText: 'small button',
    }
  })
  it('renders the default button and it works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('small button').click()
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
      `background-color: ${COLORS.errorEnabled}`
    )
  })
  it('renders the alt button', () => {
    props = {
      ...props,
      buttonType: 'alt',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`background-color: #b4d4ff`)
  })
  it('renders the ghost low button', () => {
    props = {
      ...props,
      buttonType: 'ghostLow',
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(
      `color: ${COLORS.darkBlackEnabled}${COLORS.opacity70HexCode}`
    )
  })
  it('renders the ghost high blue', () => {
    props = {
      ...props,
      buttonType: 'ghostHigh',
      textColor: COLORS.blueEnabled,
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`color: ${COLORS.blueEnabled}`)
  })
  it('renders the ghost high black', () => {
    props = {
      ...props,
      buttonType: 'ghostHigh',
      textColor: COLORS.darkBlackEnabled,
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toHaveStyle(`color: ${COLORS.darkBlackEnabled}`)
  })
  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toBeDisabled()
  })
})
