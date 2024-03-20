import * as React from 'react'
import { vi, it, expect, describe } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../__testing-utils__'
import { OverflowBtn } from '../OverflowBtn'

const render = (props: React.ComponentProps<typeof OverflowBtn>) => {
  return renderWithProviders(<OverflowBtn {...props} />)[0]
}

describe('OverflowBtn', () => {
  it('renders a clickable button', () => {
    const handleClick = vi.fn()
    const { getByRole } = render({
      onClick: handleClick,
    })

    const button = getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders a hover state', () => {
    const { getByRole } = render({
      onClick: vi.fn(),
    })

    expect(getByRole('button')).toHaveStyle(
      `background-color: ${COLORS.grey35}`
    )
  })

  it('renders an active state', () => {
    const { getByRole } = render({
      onClick: vi.fn(),
    })

    expect(getByRole('button')).toHaveStyle(
      `background-color: ${String(COLORS.grey35)}`
    )
  })

  it.skip('renders a focus state', () => {
    const { getByRole } = render({
      onClick: vi.fn(),
    })

    // @ts-expect-error Refactor to test modifier states.
    expect(getByRole('button')).toHaveStyleRule(
      'box-shadow',
      `0 0 0 3px ${String(COLORS.yellow50)}`,
      {
        modifier: ':focus-visible',
      }
    )
  })

  it.skip('renders a disabled state', () => {
    const { getByRole } = render({
      onClick: vi.fn(),
    })

    // @ts-expect-error Refactor to test modifier states.
    expect(getByRole('button')).toHaveStyleRule(
      'fill',
      `${String(COLORS.grey40)}`,
      {
        modifier: ':disabled circle',
      }
    )
  })
})
