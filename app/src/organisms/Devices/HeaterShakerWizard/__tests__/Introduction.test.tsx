import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { mockDefinition } from '../../../../redux/custom-labware/__fixtures__'
import { Introduction } from '../Introduction'
import type { ThermalAdapterName } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof Introduction>) => {
  return renderWithProviders(<Introduction {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Introduction', () => {
  let props: React.ComponentProps<typeof Introduction>
  beforeEach(() => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: null,
      moduleModel: 'heaterShakerModuleV1',
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText, getByAltText } = render(props)

    getByText(
      'Use this guide to attach the Heater-Shaker Module to your robot’s deck for secure shaking.'
    )
    getByText('You will need:')
    getByText('Thermal Adapter + Screw')
    getByText('Screw may already be in the center of the module.')
    getByText('Labware')
    getByText('Heater-Shaker Module GEN1')
    getByText('T10 Torx Screwdriver')
    getByText(
      'Provided with module. Note: using another screwdriver size can strip the module’s screws.'
    )
    getByAltText('heater_shaker_image')
    getByAltText('screwdriver_image')
  })
  it('renders the correct body when protocol has been uploaded with PCR adapter', () => {
    props = {
      labwareDefinition: mockDefinition,
      thermalAdapterName: 'PCR Adapter' as ThermalAdapterName,
      moduleModel: 'heaterShakerModuleV1',
    }

    const { getByText, getByAltText } = render(props)
    getByText('Mock Definition')
    getByText('PCR Adapter + Screw')
    getByAltText('PCR Adapter')
  })
  it('renders the correct thermal adapter info when name is Universal Flat Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: 'Universal Flat Adapter',
      moduleModel: 'heaterShakerModuleV1',
    }

    const { getByText, getByAltText } = render(props)
    getByText('Universal Flat Adapter + Screw')
    getByAltText('Universal Flat Adapter')
  })
  it('renders the correct thermal adapter info when name is Deep Well Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: 'Deep Well Adapter',
      moduleModel: 'heaterShakerModuleV1',
    }

    const { getByText, getByAltText } = render(props)
    getByText('Deep Well Adapter + Screw')
    getByAltText('Deep Well Adapter')
  })
  it('renders the correct thermal adapter info when name is 96 Flat Bottom Adapter', () => {
    props = {
      labwareDefinition: null,
      thermalAdapterName: '96 Flat Bottom Adapter',
      moduleModel: 'heaterShakerModuleV1',
    }

    const { getByText, getByAltText } = render(props)
    getByText('96 Flat Bottom Adapter + Screw')
    getByAltText('96 Flat Bottom Adapter')
  })
})
