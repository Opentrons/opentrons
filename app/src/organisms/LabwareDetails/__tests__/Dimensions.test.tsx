import { i18n } from '../../../i18n'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'
import { Dimensions } from '../Dimensions'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const render = (props: React.ComponentProps<typeof Dimensions>) => {
  return renderWithProviders(<Dimensions {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Dimensions', () => {
  let props: React.ComponentProps<typeof Dimensions>
  beforeEach(() => {
    props = {
      definition: mockDefinition,
    }
  })

  it('renders correct label and headings', () => {
    const [{ getByText, getByRole }] = render(props)

    getByText('Footprint (mm)')
    getByRole('heading', { name: 'height' })
    getByRole('heading', { name: 'width' })
    getByRole('heading', { name: 'length' })
  })
})
