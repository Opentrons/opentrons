import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PowerOn } from '../PowerOn'
import { mockMagneticModuleGen2 } from '../../../../redux/modules/__fixtures__'

const render = (props: React.ComponentProps<typeof PowerOn>) => {
  return renderWithProviders(<PowerOn {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PowerOn', () => {
  let props: React.ComponentProps<typeof PowerOn>

  // TODO(jr, 2022-02-18): fix module model to heater shaker when it exists
  beforeEach(() => {
    props = {
      attachedModule: mockMagneticModuleGen2,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText } = render(props)

    getByText('Step 3 of 4: Power on the module')
    getByText('Connect your module to the robot and and power it on.')
  })

  it('renders heater shaker SVG with info with module connected', () => {
    const { getByText } = render(props)
    getByText('Connected')
    getByText('Magnetic Module GEN2')
    getByText('USB Port 1 via hub')
  })

  it('renders heater shaker SVG with info with module not connected', () => {
    props = {
      attachedModule: null,
    }
    const { getByText } = render(props)
    getByText('Not connected')
    getByText('Magnetic Module GEN2')
    getByText('No USB Port Yet')
  })
})
