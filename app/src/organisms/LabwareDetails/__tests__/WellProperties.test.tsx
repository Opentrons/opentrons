import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockCircularLabwareWellGroupProperties } from '../../../redux/custom-labware/__fixtures__'
import { WellProperties } from '../WellProperties'

const render = (props: React.ComponentProps<typeof WellProperties>) => {
  return renderWithProviders(<WellProperties {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellProperties', () => {
  let props: React.ComponentProps<typeof WellProperties>
  beforeEach(() => {
    props = {
      wellProperties: mockCircularLabwareWellGroupProperties,
      wellLabel: 'mockLabel',
      displayVolumeUnits: 'mL',
    }
  })

  it('renders correct heading and label when wellBottomShape exists', () => {
    const [{ getByText, getByRole }] = render(props)

    getByRole('heading', { name: 'max volume' })
    getByText('0.01 mL')
    getByRole('heading', { name: 'mockLabel shape' })
    getByText('Flat_Bottom')
  })

  it('does not render wellBottomShape section when wellBottomShape is null', () => {
    props.wellProperties.metadata.wellBottomShape = undefined
    const [{ queryByRole }] = render(props)

    expect(
      queryByRole('heading', { name: 'mockLabel shape' })
    ).not.toBeInTheDocument()
  })

  it('renders correct label when volume is null', () => {
    props.wellProperties.totalLiquidVolume = null
    const [{ queryByText, getByText }] = render(props)

    expect(queryByText('0.01 mL')).not.toBeInTheDocument()
    getByText('various')
  })
})
