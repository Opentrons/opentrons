import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { SetupLiquidsList } from '../SetupLiquidsList'

const MOCK_LIQUIDS = [
  {
    liquidId: '0',
    displayName: 'mock liquid 1',
    description: 'mock sample',
    displayColor: '#ff4888',
    labwareId:
      '08433310-e1d8-11ec-8729-359ce212aee2:opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
    volumeByWell: {
      C1: 50,
      C2: 50,
    },
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
    props = { liquids: MOCK_LIQUIDS }
  })

  it('renders the total volume of the liquid, sample display name, and description', () => {
    const [{ getByText }] = render(props)
    getByText('100 µL')
    getByText('mock liquid 1')
    getByText('mock sample')
  })
})
