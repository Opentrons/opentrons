import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { PowerOn } from '../PowerOn'

const render = (props: React.ComponentProps<typeof PowerOn>) => {
  return renderWithProviders(<PowerOn {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PowerOn', () => {
  let props: React.ComponentProps<typeof PowerOn>

  beforeEach(() => {
    props = {
      attachedModule: mockHeaterShaker,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body when protocol has not been uploaded', () => {
    const { getByText } = render(props)

    getByText('Step 2 of 4: Power on the module')
    getByText('Connect your module to the robot and and power it on.')
  })

  it('renders heater shaker SVG with info with module connected', () => {
    if (props.attachedModule != null && props.attachedModule.usbPort != null) {
      props.attachedModule.usbPort.port = 1
    }
    const { getByText } = render(props)
    getByText('Connected')
    getByText('Heater-Shaker Module GEN1')
    getByText('USB Port 1')
  })

  it('renders heater shaker SVG with info with module not connected', () => {
    props = {
      attachedModule: null,
    }
    const { getByText } = render(props)
    getByText('Not connected')
    getByText('Heater-Shaker Module GEN1')
    getByText('No USB Port Yet')
  })
})
