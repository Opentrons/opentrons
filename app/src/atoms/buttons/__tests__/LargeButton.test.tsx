import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'

import { LargeButton } from '../LargeButton'

const render = (props: React.ComponentProps<typeof LargeButton>) => {
  return renderWithProviders(<LargeButton {...props} />)[0]
}

describe('LargeButton', () => {
  let props: React.ComponentProps<typeof LargeButton>
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      buttonText: 'large button',
      iconName: 'play-round-corners',
    }
  })
  it('renders the default button and it works as expected', () => {
    const { getByText, getByRole } = render(props)
    getByText('large button').click()
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
    expect(getByRole('button')).toHaveStyle(`background-color: ${COLORS.red3}`)
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
  it('renders the button as disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    const { getByRole } = render(props)
    expect(getByRole('button')).toBeDisabled()
  })
})
