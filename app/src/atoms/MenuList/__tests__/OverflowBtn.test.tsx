import 'jest-styled-components'
import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { LEGACY_COLORS, renderWithProviders } from '@opentrons/components'
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
      `${String(COLORS.grey30)}`,
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
      `${String(COLORS.grey35)}`,
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
      'box-shadow',
      `0 0 0 3px ${String(COLORS.blue50)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it('renders a disabled state', () => {
    const { getByRole } = render({
      onClick: jest.fn(),
    })

    expect(getByRole('button')).toHaveStyleRule(
      'fill',
      `${String(LEGACY_COLORS.successDisabled)}`,
      {
        modifier: ':disabled circle',
      }
    )
  })
})
