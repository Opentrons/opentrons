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
      volumeByWell: { A1: 50, B1: 50 },
      labwareWellOrdering: [
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
      ],
      setSelectedValue: jest.fn(),
      selectedValue: '2',
    }
  })

  it('renders liquid name, description, total volume', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Mock Liquid')
    getByText('Mock Description')
    getAllByText(nestedTextMatcher('100 µL'))
  })
  it('renders well volume information if selected', () => {
    const [{ getByText, getAllByText }] = render({
      ...props,
      selectedValue: '0',
    })
    getByText('A1')
    getByText('B1')
    getAllByText(nestedTextMatcher('50 µL'))
  })
  it('renders well range for volume info if selected', () => {
    const [{ getByText }] = render({
      ...props,
      selectedValue: '0',
      volumeByWell: { A1: 50, B1: 50, C1: 50, D1: 50 },
    })
    getByText('A1: D1')
    getByText(nestedTextMatcher('50 µL'))
  })
})
