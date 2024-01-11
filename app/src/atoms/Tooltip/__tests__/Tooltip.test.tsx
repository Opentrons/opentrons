import * as React from 'react'
import {
  renderWithProviders,
  TOOLTIP_TOP,
  SPACING,
  LEGACY_COLORS,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { Tooltip } from '..'

const render = (props: React.ComponentProps<typeof Tooltip>) => {
  return renderWithProviders(<Tooltip {...props} />)[0]
}

const placement = TOOLTIP_TOP
const id = 'Tooltip_123'
const tooltipRef = jest.fn()
const tooltipStyle = {
  position: POSITION_ABSOLUTE,
  left: SPACING.spacing4,
} as const
const arrowRef = jest.fn()
const arrowStyle = {
  position: POSITION_ABSOLUTE,
  left: SPACING.spacing8,
} as const

const MockTooltipProps = {
  id: id,
  placement: placement,
  arrowStyle: arrowStyle,
  arrowRef: arrowRef,
  visible: true,
  ref: tooltipRef,
  style: tooltipStyle,
}

describe('Tooltip', () => {
  let props: React.ComponentProps<typeof Tooltip>

  beforeEach(() => {
    props = {
      children: 'mock children' as React.ReactNode,
      tooltipProps: MockTooltipProps,
      key: 'mock key',
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct children when the tooltip is visible', () => {
    const { getByText } = render(props)
    const tooltip = getByText('mock children')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveStyle('position: absolute')
    expect(tooltip).toHaveStyle('left: 0.25rem')
    expect(tooltip).toHaveStyle(`background: ${String(COLORS.black90)}`)
    expect(tooltip).toHaveStyle(`color: ${String(COLORS.white)}`)
    expect(tooltip).toHaveStyle('width: 8.75rem')
    expect(tooltip).toHaveStyle('font-size: 0.625rem')
    expect(tooltip).toHaveAttribute('role', 'tooltip')
  })

  it('renders correct children when the tooltip is visible with a specific with', () => {
    props = { ...props, width: '3rem' }
    const { getByText } = render(props)
    const tooltip = getByText('mock children')
    expect(tooltip).toHaveStyle('width: 3rem')
  })

  it('does not render children when the tooltip is invisible', () => {
    MockTooltipProps.visible = false
    const { queryByText } = render(props)
    const tooltip = queryByText('mock children')
    expect(tooltip).not.toBeInTheDocument()
  })
})
