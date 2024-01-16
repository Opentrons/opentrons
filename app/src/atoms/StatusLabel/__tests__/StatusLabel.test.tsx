import * as React from 'react'
import { C_SKY_BLUE, COLORS, renderWithProviders } from '@opentrons/components'
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
      iconColor: COLORS.blue50,
      id: 'engaged_status',
      showIcon: true,
    }
    const { getByText, getByTestId } = render(props)
    expect(getByText('Engaged')).toHaveStyle('backgroundColor: C_SKY_BLUE')
    getByTestId('status_label_Engaged_engaged_status')
  })

  it('renders a disengaged status label with a blue background and text', () => {
    props = {
      status: 'Disengaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    const { getByText } = render(props)
    expect(getByText('Disengaged')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders an idle status label with a gray background and text', () => {
    props = {
      status: 'Idle',
      backgroundColor: COLORS.grey30,
      iconColor: COLORS.grey50,
      textColor: COLORS.black90,
      showIcon: false,
    }
    const { getByText } = render(props)
    expect(getByText('Idle')).toHaveStyle('backgroundColor: C_SILVER_GRAY')
    expect(getByText('Idle')).toHaveStyle('color: #16212d')
  })

  it('renders a holding at target status label with a blue background and text', () => {
    props = {
      status: 'holding at target',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    const { getByText } = render(props)
    expect(getByText('Holding at target')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a cooling status label with a blue background and text', () => {
    props = {
      status: 'cooling',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    const { getByText } = render(props)
    expect(getByText('Cooling')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a heating status label with a blue background and text', () => {
    props = {
      status: 'heating',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    const { getByText } = render(props)
    expect(getByText('Heating')).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a status label with a pulsing icon', () => {
    props = {
      status: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
      pulse: true,
    }
    const { getByTestId } = render(props)
    const pulsingCircle = getByTestId('pulsing_status_circle')
    expect(pulsingCircle).toHaveAttribute('attributeName', 'fill')
    expect(pulsingCircle).toHaveAttribute(
      'values',
      `${String(props.iconColor)}; transparent`
    )
    expect(pulsingCircle).toHaveAttribute('dur', '1s')
    expect(pulsingCircle).toHaveAttribute('calcMode', 'discrete')
    expect(pulsingCircle).toHaveAttribute('repeatCount', 'indefinite')
  })
})
