import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ConcurrentGroup } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ConcurrentGroup>) => {
  return renderWithProviders(<ConcurrentGroup {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ConcurrentGroup', () => {
  it('renders children inside a list', () => {
    render({
      active: false,
      children: (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </>
      ),
    })

    const list = screen.getByRole('list')
    expect(within(list).getByTestId('child-1')).toBeInTheDocument()
    expect(within(list).getByTestId('child-2')).toBeInTheDocument()
    expect(within(list).getByTestId('child-3')).toBeInTheDocument()
  })

  it('renders a gray line when not active', () => {
    render({ active: false })
    const ornamentalLine = screen.getByLabelText(
      'ConcurrentGroup OrnamentalLine'
    )
    expect(ornamentalLine).toHaveStyle(`background-color: ${COLORS.grey50}`)
  })

  it('renders a blue line when active', () => {
    render({ active: true })
    const ornamentalLine = screen.getByLabelText(
      'ConcurrentGroup OrnamentalLine'
    )
    expect(ornamentalLine).toHaveStyle(`background-color: ${COLORS.blue50}`)
  })
})
