import * as React from 'react'
import { C_BLUE, C_SKY_BLUE, renderWithProviders } from '@opentrons/components'
import { StatusLabel } from '..'

const render = (props: React.ComponentProps<typeof StatusLabel>) => {
  return renderWithProviders(<StatusLabel {...props} />)[0]
}

describe('StatusLabel', () => {
  let props: React.ComponentProps<typeof StatusLabel>

  it('renders an engaged status label with a blue background and text', () => {
    props = {
      status: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    expect(getByText('Engaged')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a disengaged status label with a blue background and text', () => {
    props = {
      status: 'Disengaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    expect(getByText('Disengaged')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a status label with a pulsing icon', () => {
    props = {
      status: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
      pulse: true,
    }
    const { getByTestId } = render(props)
    const pulsingCircle = getByTestId('pulsing_status_circle')
    expect(pulsingCircle).toHaveAttribute('attributeName', 'fill')
    expect(pulsingCircle).toHaveAttribute(
      'values',
      `${props.iconColor}; transparent`
    )
    expect(pulsingCircle).toHaveAttribute('dur', '1s')
    expect(pulsingCircle).toHaveAttribute('calcMode', 'discrete')
    expect(pulsingCircle).toHaveAttribute('repeatCount', 'indefinite')
  })
})
