import type * as React from 'react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { BORDERS, COLORS } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { TiprackOption } from '../TiprackOption'

const render = (props: React.ComponentProps<typeof TiprackOption>) => {
  return renderWithProviders(<TiprackOption {...props} />)[0]
}

describe('TiprackOption', () => {
  let props: React.ComponentProps<typeof TiprackOption>
  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      isSelected: true,
      isDisabled: false,
      text: 'mockText',
    }
  })
  it('renders a selected tiprack option', () => {
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('TiprackOption_flex_mockText')).toHaveStyle(
      `background-color: ${COLORS.blue10}`
    )
    fireEvent.click(screen.getByText('mockText'))
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders an unselected tiprack option', () => {
    props.isSelected = false
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('TiprackOption_flex_mockText')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
    fireEvent.click(screen.getByText('mockText'))
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders a disabled tiprack option', () => {
    props.isSelected = false
    props.isDisabled = true
    render(props)
    expect(screen.getByLabelText('TiprackOption_flex_mockText')).toHaveStyle(
      `border: 1px ${BORDERS.styleSolid} ${COLORS.grey30}`
    )
  })
})
