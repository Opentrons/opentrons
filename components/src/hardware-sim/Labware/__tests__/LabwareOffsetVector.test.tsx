import * as React from 'react'

import { renderWithProviders } from '../../../testing/utils'
import { SPACING, TYPOGRAPHY } from '../../../ui-style-constants'

import { LabwareOffsetVector } from '../LabwareOffsetVector'

const render = (props: React.ComponentProps<typeof LabwareOffsetVector>) => {
  return renderWithProviders(<LabwareOffsetVector {...props} />)[0]
}

describe('LabwareOffsetVector', () => {
  let props: React.ComponentProps<typeof LabwareOffsetVector>

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

    expect(getByText('X')).toHaveStyle(`margin-right: ${SPACING.spacing4}`)
    expect(getByText('X')).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    const x = getByText('10.00')
    expect(x).toHaveStyle(`margin-right: ${SPACING.spacing8}`)

    expect(getByText('Y')).toHaveStyle(`margin-right: ${SPACING.spacing4}`)
    expect(getByText('Y')).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    const y = getByText('20.00')
    expect(y).toHaveStyle(`margin-right: ${SPACING.spacing8}`)

    expect(getByText('Z')).toHaveStyle(`margin-right: ${SPACING.spacing4}`)
    expect(getByText('Z')).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    const z = getByText('30.00')
    expect(z).toHaveStyle(`margin-right: ${SPACING.spacing8}`)
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
})
