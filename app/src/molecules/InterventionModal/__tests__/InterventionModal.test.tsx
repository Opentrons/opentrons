import * as React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { COLORS, BORDERS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { InterventionModal } from '../'
import type { ModalType } from '../'

const render = (props: React.ComponentProps<typeof InterventionModal>) => {
  return renderWithProviders(<InterventionModal {...props} />)[0]
}

describe('InterventionModal', () => {
  let props: React.ComponentProps<typeof InterventionModal>

  beforeEach(() => {
    props = {
      heading: 'mock intervention heading',
      children: 'mock intervention children',
      iconName: 'alert-circle',
      type: 'intervention-required',
    }
  })
  ;(['intervention-required', 'error'] as ModalType[]).forEach(type => {
    const color =
      type === 'intervention-required' ? COLORS.blue50 : COLORS.red50
    it(`renders with the ${type} style`, () => {
      render({ ...props, type })
      const header = screen.getByTestId('__otInterventionModalHeader')
      expect(header).toHaveStyle(`background-color: ${color}`)
      const modal = screen.getByTestId('__otInterventionModal')
      expect(modal).toHaveStyle(`border: 6px ${BORDERS.styleSolid} ${color}`)
    })
  })
  it('uses intervention-required if prop is not passed', () => {
    render({ ...props, type: undefined })
    const header = screen.getByTestId('__otInterventionModalHeader')
    expect(header).toHaveStyle(`background-color: ${COLORS.blue50}`)
    const modal = screen.getByTestId('__otInterventionModal')
    expect(modal).toHaveStyle(
      `border: 6px ${BORDERS.styleSolid} ${COLORS.blue50}`
    )
  })
  it('renders passed elements', () => {
    render(props)
    screen.getByText('mock intervention children')
    screen.getByText('mock intervention heading')
  })
  it('renders an icon if an icon is specified', () => {
    const { container } = render(props)
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    const icon = container.querySelector(
      '[aria-roledescription="alert-circle"]'
    )
    expect(icon).not.toBeNull()
  })
  it('does not render an icon if no icon is specified', () => {
    const { container } = render({ ...props, iconName: undefined })
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    const icon = container.querySelector(
      '[aria-roledescription="alert-circle"]'
    )
    expect(icon).toBeNull()
  })
})
