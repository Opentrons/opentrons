import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import {
  mockDefinition,
  mockCircularLabwareWellGroupProperties,
  mockRectangularLabwareWellGroupProperties,
} from '../../../redux/custom-labware/__fixtures__'
import { WellDimensions } from '../WellDimensions'

const render = (props: React.ComponentProps<typeof WellDimensions>) => {
  return renderWithProviders(<WellDimensions {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellDimensions', () => {
  let props: React.ComponentProps<typeof WellDimensions>
  beforeEach(() => {
    props = {
      labwareParams: mockDefinition.parameters,
      wellProperties: mockCircularLabwareWellGroupProperties,
      wellLabel: 'mockLabel',
      category: 'mockCategory',
      labelSuffix: 'mockSuffix',
    }
  })

  it('renders correct label and headings for circular well', () => {
    const [{ getByText, getByRole }] = render(props)

    getByText('mockLabel Measurements (mm) mockSuffix')
    getByRole('heading', { name: 'depth' })
    getByRole('heading', { name: 'diameter' })
  })

  it('renders correct label and headings for rectangular well', () => {
    props.wellProperties = mockRectangularLabwareWellGroupProperties
    const [{ getByText, getByRole }] = render(props)

    getByText('mockLabel Measurements (mm) mockSuffix')
    getByRole('heading', { name: 'depth' })
    getByRole('heading', { name: 'x-size' })
    getByRole('heading', { name: 'y-size' })
  })

  it('does not render total length heading when isTipRack is false', () => {
    const [{ queryByRole }] = render(props)

    expect(
      queryByRole('heading', { name: 'total length' })
    ).not.toBeInTheDocument()
  })

  it('renders correct heading when isTipRack is true', () => {
    props.labwareParams.isTiprack = true
    const [{ getByRole }] = render(props)

    getByRole('heading', { name: 'total length' })
  })
})
