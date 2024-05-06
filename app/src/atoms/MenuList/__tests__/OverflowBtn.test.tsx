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
      `background-color: ${COLORS.transparent}`
    )
  })
})
