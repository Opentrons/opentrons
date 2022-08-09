import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockCircularLabwareWellGroupProperties } from '../../../redux/custom-labware/__fixtures__'
import { WellSpacing } from '../WellSpacing'

const render = (props: React.ComponentProps<typeof WellSpacing>) => {
  return renderWithProviders(<WellSpacing {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellSpacing', () => {
  let props: React.ComponentProps<typeof WellSpacing>
  beforeEach(() => {
    props = {
      wellProperties: mockCircularLabwareWellGroupProperties,
    }
  })

  it('renders correct labels when xSpacing and ySpacing have values', () => {
    const [{ getAllByText, getByRole }] = render(props)

    getByRole('heading', { name: 'x-offset' })
    getByRole('heading', { name: 'y-offset' })
    getByRole('heading', { name: 'x-spacing' })
    getByRole('heading', { name: 'y-spacing' })
    expect(getAllByText('1.00')).toHaveLength(4)
  })

  it('renders correct labels when xSpacing and ySpacing are null', () => {
    props.wellProperties = {
      ...props.wellProperties,
      xSpacing: null,
      ySpacing: null,
    }
    const [{ getAllByText }] = render(props)

    expect(getAllByText('1.00')).toHaveLength(2)
    expect(getAllByText('various')).toHaveLength(2)
  })
})
