import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { InstrumentCard } from '..'

const mockOnClick = jest.fn()
const mockDisabledOnClick = jest.fn()

const renderInstrumentCard = () =>
  render(
    <InstrumentCard
      description="new instrument GEN4"
      label="multipurpose grommet"
      menuOverlayItems={[
        {
          label: 'menu option 1',
          disabled: false,
          onClick: mockOnClick,
        },
        {
          label: 'menu option 2',
          disabled: true,
          onClick: mockDisabledOnClick,
        },
      ]}
    />
  )

describe('InstrumentCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders instrument card label and description', () => {
    renderInstrumentCard()
    screen.getByText('new instrument GEN4')
    screen.getByText('multipurpose grommet')
  })

  it('renders overflow menu items when overflow button clicked', () => {
    renderInstrumentCard()
    fireEvent.click(screen.getByRole('button'))
    const activeMenuItem = screen.getByRole('button', { name: 'menu option 1' })
    const disabledMenuItem = screen.getByRole('button', { name: 'menu option 2' })
    expect(activeMenuItem).not.toBeDisabled()
    expect(disabledMenuItem).toBeDisabled()
    fireEvent.click(activeMenuItem)
    expect(mockOnClick).toBeCalled()
    fireEvent.click(disabledMenuItem)
    expect(mockDisabledOnClick).not.toBeCalled()
  })
})
