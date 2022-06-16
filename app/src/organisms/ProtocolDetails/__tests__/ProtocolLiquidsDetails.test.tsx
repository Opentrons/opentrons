import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { ProtocolLiquidsDetails } from '../ProtocolLiquidsDetails'

const MOCK_LIQUID = [
  {
    liquidId: '0',
    displayName: 'mock liquid 1',
    description: 'mock sample',
    displayColor: '#ff4888',
    locations: [
      {
        labwareName: 'Mock Labware',
        slotName: '5',
        volumeByWell: {
          C1: 50,
          C2: 50,
        },
      },
    ],
  },
]

const render = (props: React.ComponentProps<typeof ProtocolLiquidsDetails>) => {
  return renderWithProviders(<ProtocolLiquidsDetails {...props} />)
}

describe('ProtocolLiquidsDetails', () => {
  let props: React.ComponentProps<typeof ProtocolLiquidsDetails>
  beforeEach(() => {
    props = { liquids: MOCK_LIQUID }
  })

  it('renders the display name, description and total volume', () => {
    const [{ getByText }] = render(props)
    getByText('100 µL')
    getByText('mock liquid 1')
    getByText('mock sample')
  })
})
