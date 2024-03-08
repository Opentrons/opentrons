import * as React from 'react'
import { vi, describe, beforeEach, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { COLORS } from '@opentrons/components'
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
      text: 'mockText',
    }
  })
  it('renders a selected tiprack option', () => {
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('TiprackOption_checkbox-marked')).toHaveStyle(
      `color: ${COLORS.blue50}`
    )
  })
  it('renders an unselected tiprack option', () => {
    props.isSelected = false
    render(props)
    screen.getByText('mockText')
    expect(
      screen.getByLabelText('TiprackOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.grey50}`)
  })
})
