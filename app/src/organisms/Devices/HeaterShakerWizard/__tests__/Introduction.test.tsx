import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { Introduction } from '../Introduction'

const render = (props: React.ComponentProps<typeof Introduction>) => {
  return renderWithProviders(<Introduction {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Introduction', () => {
  let props: React.ComponentProps<typeof Introduction>
  beforeEach(() => {
    props = {
      labwareDefinition: undefined,
      thermalAdapterName: undefined,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText, getByAltText } = render(props)

    getByText(
      'Use this guide to attach the Heater Shaker Module to your robot’s deck for secure shaking.'
    )
    getByText('You will need:')
    getByText('Thermal Adapter + Screw')
    getByText('Screw may already be in the center of the module.')
    getByText('Labware')
    getByText('Heater Shaker Module')
    getByText('T10 Torx Screwdriver')
    getByText(
      'Provided with module. Note: using another screwdriver size can strip the module’s screws.'
    )
    getByAltText('heater_shaker_image')
    getByAltText('screwdriver_image')
  })
  //  TODO immediately: add test when the labware def and thermal adapter can be plugged in
  it.todo('renders the correct body when protocol has been uploaded')
})
