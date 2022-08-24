import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ManufacturerDetails } from '../ManufacturerDetails'

const render = (props: React.ComponentProps<typeof ManufacturerDetails>) => {
  return renderWithProviders(<ManufacturerDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ManufacturerDetails', () => {
  let props: React.ComponentProps<typeof ManufacturerDetails>
  beforeEach(() => {
    props = {
      brand: { brand: 'Opentrons' },
    }
  })

  it('renders correct heading and manufacturerValue and no links or brandId when only brand is passed as prop', () => {
    const [{ getByRole, getByText, queryByRole }] = render(props)

    getByRole('heading', { name: 'manufacturer' })
    getByText('Opentrons')
    expect(queryByRole('link')).not.toBeInTheDocument()
    expect(
      queryByRole('heading', { name: 'manufacturer / catalog #' })
    ).not.toBeInTheDocument()
  })

  it('renders correct number of links', () => {
    props.brand.links = ['https://www.opentrons.com', 'https://www.test.com']
    const [{ getAllByRole }] = render(props)

    expect(getAllByRole('link', { name: 'website' })).toHaveLength(2)
  })

  it('renders brandIds', () => {
    props.brand.brandId = ['mockId', 'mockId2']
    const [{ getByRole, getByText }] = render(props)

    getByRole('heading', { name: 'manufacturer / catalog #' })
    getByText('mockId, mockId2')
  })
})
