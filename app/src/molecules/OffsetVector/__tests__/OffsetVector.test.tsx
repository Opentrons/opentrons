import * as React from 'react'
import { renderWithProviders, SPACING, TYPOGRAPHY } from '@opentrons/components'

import { OffsetVector } from '../'

const render = (props: React.ComponentProps<typeof OffsetVector>) => {
  return renderWithProviders(<OffsetVector {...props} />)[0]
}

describe('OffsetVector', () => {
  let props: React.ComponentProps<typeof OffsetVector>

  beforeEach(() => {
    props = {
      x: 10,
      y: 20,
      z: 30,
    }
  })

  it('renders text with correct styles', () => {
    const { getByText, getAllByRole } = render(props)
    expect(getAllByRole('heading', { level: 6 })).toHaveLength(6)

    expect(getByText('X')).toHaveStyle(`margin-right: ${SPACING.spacing2}`)
    expect(getByText('X')).toHaveStyle(
      `font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    const x = getByText('10.00')
    expect(x).toHaveStyle(`margin-right: ${SPACING.spacing3}`)

    expect(getByText('Y')).toHaveStyle(`margin-right: ${SPACING.spacing2}`)
    expect(getByText('Y')).toHaveStyle(
      `font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    const y = getByText('20.00')
    expect(y).toHaveStyle(`margin-right: ${SPACING.spacing3}`)

    expect(getByText('Z')).toHaveStyle(`margin-right: ${SPACING.spacing2}`)
    expect(getByText('Z')).toHaveStyle(
      `font-weight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    const z = getByText('30.00')
    expect(z).toHaveStyle(`margin-right: ${SPACING.spacing3}`)
  })

  it('renders numbers using fixed-point notation', () => {
    props.x = 1.0000001
    props.y = 111.11111111
    props.z = 99999.99888
    const { getByText } = render(props)
    getByText('1.00')
    getByText('111.11')
    getByText('100000.00')
  })

  it('renders text with a specific heading level', () => {
    props.as = 'h1'
    const { getAllByRole } = render(props)
    expect(getAllByRole('heading', { level: 1 })).toHaveLength(6)
  })
})
