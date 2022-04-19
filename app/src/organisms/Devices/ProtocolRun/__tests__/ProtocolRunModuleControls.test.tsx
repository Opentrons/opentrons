import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { i18n } from '../../../../i18n'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { ModuleCard } from '../../ModuleCard'
import {
  mockMagneticModuleGen2,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../../redux/modules/__fixtures__'

jest.mock('../../ModuleCard')

const mockModuleCard = ModuleCard as jest.MockedFunction<typeof ModuleCard>

const render = (props: React.ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolRunModuleControls', () => {
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders a magnetic module card', () => {
    when(mockModuleCard)
      .calledWith(
        componentPropsMatcher({
          module: mockMagneticModuleGen2,
          runId: 'test123',
        })
      )
      .mockReturnValue(<div>mock Magnetic Module Card</div>)
    const { getByText } = render({
      module: mockMagneticModuleGen2,
      runId: 'test123',
    })

    getByText('mock Magnetic Module Card')
  })

  it('renders a temperature module card', () => {
    when(mockModuleCard)
      .calledWith(
        componentPropsMatcher({
          module: mockTemperatureModuleGen2,
          runId: 'test123',
        })
      )
      .mockReturnValue(<div>mock Temperature Module Card</div>)
    const { getByText } = render({
      module: mockTemperatureModuleGen2,
      runId: 'test123',
    })

    getByText('mock Temperature Module Card')
  })

  it('renders a thermocycler module card', () => {
    when(mockModuleCard)
      .calledWith(
        componentPropsMatcher({
          module: mockThermocycler,
          runId: 'test123',
        })
      )
      .mockReturnValue(<div>mock Thermocycler Module Card</div>)
    const { getByText } = render({
      module: mockThermocycler,
      runId: 'test123',
    })

    getByText('mock Thermocycler Module Card')
  })

  it('renders a heater-shaker module card', () => {
    when(mockModuleCard)
      .calledWith(
        componentPropsMatcher({
          module: mockHeaterShaker,
          runId: 'test123',
        })
      )
      .mockReturnValue(<div>mock Heater-Shaker Module Card</div>)
    const { getByText } = render({
      module: mockHeaterShaker,
      runId: 'test123',
    })

    getByText('mock Heater-Shaker Module Card')
  })
})
