import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { StatusLabel } from '../../../atoms/StatusLabel'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import {
  mockThermocycler,
  mockThermocyclerGen2,
} from '../../../redux/modules/__fixtures__'

import type { ThermocyclerData } from '../../../redux/modules/api-types'

jest.mock('../../../atoms/StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof ThermocyclerModuleData>) => {
  return renderWithProviders(<ThermocyclerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockDataBase = {
  lidStatus: 'open',
  lidTargetTemperature: null,
  lidTemperature: null,
  currentTemperature: null,
  targetTemperature: null,
  holdTime: null,
  rampRate: null,
  currentCycleIndex: null,
  totalCycleCount: null,
  currentStepIndex: null,
  totalStepCount: null,
}

const mockDataHoldingAtTarget = {
  ...mockDataBase,
  status: 'holding at target',
} as ThermocyclerData

const mockDataCooling = {
  ...mockDataBase,
  status: 'cooling',
} as ThermocyclerData

const mockDataHeating = {
  ...mockDataBase,
  status: 'heating',
} as ThermocyclerData

describe('ThermocyclerModuleData', () => {
  let props: React.ComponentProps<typeof ThermocyclerModuleData>
  beforeEach(() => {
    props = {
      moduleModel: mockThermocycler.moduleModel,
      data: mockThermocycler.data,
    }
    mockStatusLabel.mockReturnValue(<div>Mock Thermocycler StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an idle status', () => {
    const { getByText } = render(props)

    expect(getByText('Mock Thermocycler StatusLabel')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
  })

  it('renders a holding at target status', () => {
    props = {
      ...props,
      data: mockDataHoldingAtTarget,
    }
    const { getByText } = render(props)

    expect(getByText('Mock Thermocycler StatusLabel')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a cooling status', () => {
    props = {
      ...props,
      data: mockDataCooling,
    }
    const { getByText } = render(props)

    expect(getByText('Mock Thermocycler StatusLabel')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a heating status', () => {
    props = {
      ...props,
      data: mockDataHeating,
    }
    const { getByText } = render(props)

    expect(getByText('Mock Thermocycler StatusLabel')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders an error status', () => {
    props = {
      ...props,
      data: mockDataHeating,
    }
    const { getByText } = render(props)

    expect(getByText('Mock Thermocycler StatusLabel')).toHaveStyle(
      'backgroundColor: COLORS.warningBackgroundLight'
    )
  })

  it('renders thermocycler gen 1 lid temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Lid')
    getByTitle('lid_target_temp')
    getByTitle('lid_temp')
  })

  it('renders thermocycler gen 1 block temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Block')
    getByTitle('tc_target_temp')
    getByTitle('tc_current_temp')
  })

  it('renders a thermocycler gen 2 status labels', () => {
    props = {
      moduleModel: mockThermocyclerGen2.moduleModel,
      data: mockThermocyclerGen2.data,
    }
    const { getAllByText } = render(props)
    expect(getAllByText('Mock Thermocycler StatusLabel')).toHaveLength(2)
  })
})
