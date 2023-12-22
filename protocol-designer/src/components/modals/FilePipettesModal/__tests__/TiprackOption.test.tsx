import * as React from 'react'
import { screen } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { TiprackOption } from '../TiprackOption'

const render = (props: React.ComponentProps<typeof TiprackOption>) => {
  return renderWithProviders(<TiprackOption {...props} />)[0]
}

describe('TiprackOption', () => {
  let props: React.ComponentProps<typeof TiprackOption>
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      isSelected: true,
      text: 'mockText',
    }
  })
  it('renders a selected tiprack option', () => {
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('TiprackOption_checkbox-marked')).toHaveStyle(
      `color: ${COLORS.blueEnabled}`
    )
  })
  it('renders an unselected tiprack option', () => {
    props.isSelected = false
    screen.getByText('mockText')
    expect(
      screen.getByLabelText('TiprackOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
  })
})
