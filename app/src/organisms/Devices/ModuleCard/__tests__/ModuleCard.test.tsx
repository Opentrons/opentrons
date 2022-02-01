import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'
import { ModuleCard } from '..'

import { i18n } from '../../../../i18n'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'
import { StatusLabel } from '../StatusLabel'

jest.mock('../StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleCard', () => {
  let props: React.ComponentProps<typeof ModuleCard>

  beforeEach(() => {
    props = {
      module: mockMagneticModule,
    }
    mockStatusLabel.mockReturnValue(<div>Mock Status Label</div>)
  })

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Magnetic Module GEN1')
    getByText('Mock Status Label')
    getByText('usb port 1')
    getByAltText('magneticModuleV1')
  })
})
