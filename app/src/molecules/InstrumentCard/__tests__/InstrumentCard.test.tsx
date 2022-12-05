import * as React from 'react'
import { render } from '@testing-library/react'

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
    const { getByText } = renderInstrumentCard()

    getByText('new instrument GEN4')
    getByText('multipurpose grommet')
  })

  it('renders overflow menu items when overflow button clicked', () => {
    const { getByRole } = renderInstrumentCard()

    getByRole('button').click()
    const activeMenuItem = getByRole('button', { name: 'menu option 1' })
    const disabledMenuItem = getByRole('button', { name: 'menu option 2' })
    expect(activeMenuItem).not.toBeDisabled()
    expect(disabledMenuItem).toBeDisabled()
    activeMenuItem.click()
    expect(mockOnClick).toBeCalled()
    disabledMenuItem.click()
    expect(mockDisabledOnClick).not.toBeCalled()
  })
})
