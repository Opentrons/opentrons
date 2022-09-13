import * as React from 'react'
import { renderWithProviders, COLORS, SPACING } from '@opentrons/components'

import { ModuleIcon } from '../'

import type { AttachedModule } from '../../../redux/modules/types'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})

const render = (props: React.ComponentProps<typeof ModuleIcon>) => {
  return renderWithProviders(<ModuleIcon {...props} />)[0]
}

const mockTemperatureModule = {
  moduleModel: 'temperatureModuleV1',
  moduleType: 'temperatureModuleType',
  data: {},
} as AttachedModule

const mockMagneticModule = {
  moduleModel: 'magneticModuleV1',
  moduleType: 'magneticModuleType',
  data: {},
} as AttachedModule

const mockThermocyclerModule = {
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  data: {},
} as AttachedModule

const mockHeaterShakerModule = {
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  data: {},
} as AttachedModule

describe('ModuleIcon', () => {
  let props: React.ComponentProps<typeof ModuleIcon>

  beforeEach(() => {
    props = {
      module: mockTemperatureModule,
      tooltipText: 'mock ModuleIcon',
    }
  })

  it('renders SharedIcon with correct style', () => {
    const { getByTestId } = render(props)
    const module = getByTestId('ModuleIcon_ot-temperature-v2')
    expect(module).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
    expect(module).toHaveStyle(`height: ${SPACING.spacing4}`)
    expect(module).toHaveStyle(`width: ${SPACING.spacing4}`)
    expect(module).toHaveStyle(`margin-left: ${SPACING.spacing1}`)
    expect(module).toHaveStyle(`margin-right: ${SPACING.spacing1}`)
    expect(module).toHaveStyleRule('color', `${COLORS.darkBlackEnabled}`, {
      modifier: ':hover',
    })
  })

  it('renders magnetic module icon', () => {
    props.module = mockMagneticModule
    const { getByTestId } = render(props)
    getByTestId('ModuleIcon_ot-magnet-v2')
  })

  it('renders thermocycler module icon', () => {
    props.module = mockThermocyclerModule
    const { getByTestId } = render(props)
    getByTestId('ModuleIcon_ot-thermocycler')
  })

  it('renders heatershaker module icon', () => {
    props.module = mockHeaterShakerModule
    const { getByTestId } = render(props)
    getByTestId('ModuleIcon_ot-heater-shaker')
  })

  it('tooltip displays mock text message', () => {
    const { getByText } = render(props)
    getByText('mock ModuleIcon')
  })
})
