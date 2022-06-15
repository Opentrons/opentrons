import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { SetupLiquidsList } from '../SetupLiquidsList'
import { fireEvent } from '@testing-library/react'

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

const render = (props: React.ComponentProps<typeof SetupLiquidsList>) => {
  return renderWithProviders(<SetupLiquidsList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupLiquidsList', () => {
  let props: React.ComponentProps<typeof SetupLiquidsList>
  beforeEach(() => {
    props = { liquids: MOCK_LIQUID }
  })

  it('renders the total volume of the liquid, sample display name, and description', () => {
    const [{ getByText }] = render(props)
    getByText('100 µL')
    getByText('mock liquid 1')
    getByText('mock sample')
  })

  it('renders slot and labware info when clicking a liquid item', () => {
    const [{ getByText }] = render(props)
    const row = getByText('mock liquid 1')
    fireEvent.click(row)
    getByText('Location')
    getByText('Labware Name')
    getByText('Volume')
    getByText('Slot 5')
    getByText('Mock Labware')
  })
})
