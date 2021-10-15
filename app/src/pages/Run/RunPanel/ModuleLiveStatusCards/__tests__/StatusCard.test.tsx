import * as React from 'react'
import { screen, render } from '@testing-library/react'
import { StatusCard } from '../StatusCard'

describe('StatusCard headers', () => {
  it('should render StatusCard Header', () => {
    render(
      <StatusCard
        header={'1'}
        title={'Magnetic Module GEN 2'}
        isCardExpanded={false}
        toggleCard={jest.fn()}
      />
    )
    expect(screen.getByText(/Slot/)).toBeInTheDocument()
  })

  it('should NOT render StatusCard header', () => {
    render(
      <StatusCard
        title={'Thermocycler Module'}
        isCardExpanded={false}
        toggleCard={jest.fn()}
      />
    )
    expect(screen.queryByText(/Slot/)).toBeNull()
  })
})
