import { describe, expect, it } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { C_SKY_BLUE, COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'

import { StatusLabel } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof StatusLabel>) => {
  return renderWithProviders(<StatusLabel {...props} />)[0]
}

describe('StatusLabel', () => {
  let props: ComponentProps<typeof StatusLabel>

  it('renders an engaged status label with a blue background and text', () => {
    props = {
      status: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
      showIcon: true,
    }
    render(props)
    expect(screen.getByText('Engaged')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a disengaged status label with a blue background and text', () => {
    props = {
      status: 'Disengaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    render(props)
    expect(screen.getByText('Disengaged')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders an idle status label with a gray background and text', () => {
    props = {
      status: 'Idle',
      backgroundColor: COLORS.grey30,
      iconColor: COLORS.grey50,
      textColor: COLORS.black90,
      showIcon: false,
    }
    render(props)
    expect(screen.getByText('Idle')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
    expect(screen.getByText('Idle')).toHaveStyle('color: #16212d')
  })

  it('renders a holding at target status label with a blue background and text', () => {
    props = {
      status: 'holding at target',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    render(props)
    expect(screen.getByText('Holding at target')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a cooling status label with a blue background and text', () => {
    props = {
      status: 'cooling',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    render(props)
    expect(screen.getByText('Cooling')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a heating status label with a blue background and text', () => {
    props = {
      status: 'heating',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
    }
    render(props)
    expect(screen.getByText('Heating')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a status label with a pulsing icon', () => {
    props = {
      status: 'Engaged',
      backgroundColor: C_SKY_BLUE,
      iconColor: COLORS.blue50,
      pulse: true,
    }
    render(props)
    const labelText = screen.getByText('Engaged')
    // eslint-disable-next-line testing-library/no-node-access
    const pulsingCircle = labelText.closest('div')?.querySelector('animate')
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
