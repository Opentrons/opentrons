import * as React from 'react'
import {
  C_BLUE,
  C_DARK_BLACK,
  C_DARK_GRAY,
  C_SILVER_GRAY,
  C_SKY_BLUE,
  renderWithProviders,
} from '@opentrons/components'
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

  it('renders an idle status label with a gray background and text', () => {
    props = {
      status: 'Idle',
      backgroundColor: C_SILVER_GRAY,
      iconColor: C_DARK_GRAY,
      textColor: C_DARK_BLACK,
    }
    const { getByText } = render(props)
    expect(getByText('Idle')).toHaveStyle('backgroundColor: C_SILVER_GRAY')
    expect(getByText('Idle')).toHaveStyle('color: #16212d')
  })

  it('renders an holding at target status label with a blue background and text', () => {
    props = {
      status: 'holding at target',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    expect(getByText('holding at target')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a cooling status label with a blue background and text', () => {
    props = {
      status: 'cooling',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    expect(getByText('cooling')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a heating status label with a blue background and text', () => {
    props = {
      status: 'heating',
      backgroundColor: C_SKY_BLUE,
      iconColor: C_BLUE,
    }
    const { getByText } = render(props)
    expect(getByText('heating')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })
})
