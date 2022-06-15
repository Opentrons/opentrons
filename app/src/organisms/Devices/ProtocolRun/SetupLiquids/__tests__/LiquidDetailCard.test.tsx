import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { LiquidDetailCard } from '../LiquidDetailCard'

const render = (props: React.ComponentProps<typeof LiquidDetailCard>) => {
  return renderWithProviders(<LiquidDetailCard {...props} />)
}

describe('LiquidDetailCard', () => {
  let props: React.ComponentProps<typeof LiquidDetailCard>

  beforeEach(() => {
    props = {
      liquidId: '0',
      displayName: 'Mock Liquid',
      description: 'Mock Description',
      displayColor: '#FFF',
      volumeByWell: { A1: 50 },
      setSelectedValue: jest.fn(),
      selectedValue: '0',
    }
  })

  it('renders liquid name, description, and volume', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Mock Liquid')
    getByText('Mock Description')
    getAllByText(nestedTextMatcher('50 µL'))
  })

  it('renders well volume information', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('A1')
    getAllByText(nestedTextMatcher('50 µL'))
  })
})
