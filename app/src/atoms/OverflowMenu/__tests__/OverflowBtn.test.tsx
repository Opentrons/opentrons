import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import 'jest-styled-components'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { OverflowBtn } from '../OverflowBtn'

const render = (props: React.ComponentProps<typeof OverflowBtn>) => {
  return renderWithProviders(<OverflowBtn {...props} />)[0]
}

describe('OverflowBtn', () => {
  it('renders a clickable button', () => {
    const handleClick = jest.fn()
    const { getByRole } = render({
      onClick: handleClick,
    })

    const button = getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders a hover state', () => {
    const { getByRole } = render({
      onClick: jest.fn(),
    })

    expect(getByRole('button')).toHaveStyleRule(
      'background-color',
      COLORS.medGrey,
      {
        modifier: ':hover',
      }
    )
  })

  it('renders an active state', () => {
    const { getByRole } = render({
      onClick: jest.fn(),
    })

    expect(getByRole('button')).toHaveStyleRule(
      'background-color',
      COLORS.lightBlue,
      {
        modifier: ':active',
      }
    )
  })

  it('renders a focus state', () => {
    const { getByRole } = render({
      onClick: jest.fn(),
    })

    expect(getByRole('button')).toHaveStyleRule(
      'outline',
      '3px solid #deecff',
      {
        modifier: ':focus',
      }
    )
  })

  it('renders a disabled state', () => {
    const { getByRole } = render({
      onClick: jest.fn(),
    })

    expect(getByRole('button')).toHaveStyleRule('fill-opacity', '0.5', {
      modifier: ':disabled',
    })
  })
})
