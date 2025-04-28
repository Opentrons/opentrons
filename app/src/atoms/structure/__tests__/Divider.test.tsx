import { beforeEach, describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { COLORS, SPACING } from '@opentrons/components'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import type { ComponentProps } from 'react'
import { Divider } from '../index'

const render = (props: ComponentProps<typeof Divider>) => {
  return renderWithProviders(<Divider {...props} />)[0]
}

describe('Divider', () => {
  let props: ComponentProps<typeof Divider>

  beforeEach(() => {
    props = {
      width: '80%',
    }
  })

  it('renders divider', () => {
    render(props)
    const divider = screen.getByTestId('divider')
    expect(divider).toHaveStyle(`borderBottom: 1px solid ${COLORS.grey30}`)
    expect(divider).toHaveStyle('width: 80%')
    expect(divider).toHaveStyle(`margin-top: ${SPACING.spacing4}`)
    expect(divider).toHaveStyle(`margin-bottom: ${SPACING.spacing4}`)
  })

  it('renders divider with additional props', () => {
    props = {
      ...props,
      width: '100%',
      color: COLORS.blue50,
      marginY: 0,
      paddingX: SPACING.spacing4,
    }
    render(props)
    const divider = screen.getByTestId('divider')
    expect(divider).toHaveStyle(`color: ${COLORS.blue50}`)
    expect(divider).toHaveStyle('width: 100%')
    expect(divider).toHaveStyle('margin-top: 0')
    expect(divider).toHaveStyle('margin-bottom: 0')
    expect(divider).toHaveStyle('padding-left: 0.25rem')
    expect(divider).toHaveStyle('padding-right: 0.25rem')
  })
})
