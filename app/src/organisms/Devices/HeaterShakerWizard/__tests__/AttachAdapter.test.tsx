import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { AttachAdapter } from '../AttachAdapter'

const render = () => {
  return renderWithProviders(<AttachAdapter />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachAdapter', () => {
  it('renders all the Attach adapter component text and images', () => {
    const { getByText, getByAltText, getByLabelText } = render()

    getByText('Step 2 of 4: Attach Thermal Adapter')
    getByText('Attach your adapter to the module.')
    getByText('Please use T10 Torx Screwdriver and provided screw')
    getByText(
      'Using a different screwdriver can strip the screws. Using a different screw than the one provided can damage the module'
    )
    getByText('Check alignment.')
    getByText('A properly attached adapter will sit evenly on the module.')
    getByText('2a')
    getByText('Check attachment by rocking the adapter back and forth.')
    getByText('2b')
    getByText('2c')
    getByAltText('heater_shaker_adapter_alignment')
    getByAltText('screw_in_adapter')
    getByLabelText('information')
  })
})
