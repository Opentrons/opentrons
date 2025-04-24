import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LiquidIcon } from '..'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { renderWithProviders } from '../../../testing/utils'
import { SPACING } from '../../../ui-style-constants'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof LiquidIcon>) => {
  return renderWithProviders(<LiquidIcon {...props} />)
}

describe('LiquidIcon', () => {
  let props: ComponentProps<typeof LiquidIcon>

  it('should render the proper style for large icon', () => {
    props = {
      size: 'medium',
      color: COLORS.red50,
    }
    render(props)
    const LiquidIcon = screen.getByTestId(`LiquidIcon_${COLORS.red50}`)
    expect(LiquidIcon).toHaveStyle(`padding: ${SPACING.spacing12}`)
    expect(LiquidIcon).toHaveStyle('height: max-content')
    expect(LiquidIcon).toHaveStyle('width: max-content')
    expect(LiquidIcon).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(LiquidIcon).toHaveStyle(`border-style: ${BORDERS.styleSolid}`)
    expect(LiquidIcon).toHaveStyle(`border-width: 1px`)
    expect(LiquidIcon).toHaveStyle(`border-color: ${COLORS.grey30}`)
    expect(LiquidIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius4}`)
  })

  it('should render the proper style for large icon', () => {
    props = {
      size: 'small',
      color: COLORS.blue50,
    }
    render(props)
    const LiquidIcon = screen.getByTestId(`LiquidIcon_${COLORS.blue50}`)
    expect(LiquidIcon).toHaveStyle(`padding: ${SPACING.spacing8}`)
    expect(LiquidIcon).toHaveStyle('height: max-content')
    expect(LiquidIcon).toHaveStyle('width: max-content')
    expect(LiquidIcon).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(LiquidIcon).toHaveStyle(`border-style: ${BORDERS.styleSolid}`)
    expect(LiquidIcon).toHaveStyle(`border-width: 1px`)
    expect(LiquidIcon).toHaveStyle(`border-color: ${COLORS.grey30}`)
    expect(LiquidIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius4}`)
  })
})
