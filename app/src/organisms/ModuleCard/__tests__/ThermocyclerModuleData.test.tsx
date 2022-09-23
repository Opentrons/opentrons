import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import {
  mockThermocycler,
  mockThermocyclerGen2,
} from '../../../redux/modules/__fixtures__'

import type { ThermocyclerData } from '../../../redux/modules/api-types'

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
      data: mockThermocycler.data,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an idle status', () => {
    const { getByTestId } = render(props)

    expect(getByTestId('status_label+idle')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
  })

  it('renders a holding at target status', () => {
    props = {
      data: mockDataHoldingAtTarget,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label+holding at target')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a cooling status', () => {
    props = {
      data: mockDataCooling,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label+cooling')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a heating status', () => {
    props = {
      data: mockDataHeating,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label+heating')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders an error status', () => {
    props = {
      data: mockDataHeating,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label+heating')).toHaveStyle(
      'backgroundColor: COLORS.warningBackgroundLight'
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid opened', () => {
    const { getByText, getByTitle, getByTestId } = render(props)

    getByText('Lid')
    getByTitle('lid_target_temp')
    getByTitle('lid_temp')
    getByTestId('status_label+open')
  })

  it('renders thermocycler gen 1 lid temperature data with lid closed', () => {
    props = {
      data: {
        lidStatus: 'closed',
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
        status: 'idle',
      } as ThermocyclerData,
    }
    const { getByText, getByTitle, getByTestId } = render(props)

    getByText('Lid')
    getByTitle('lid_target_temp')
    getByTitle('lid_temp')
    getByTestId('status_label+closed')
  })

  it('renders thermocycler gen 1 block temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Block')
    getByTitle('tc_target_temp')
    getByTitle('tc_current_temp')
  })

  it('renders a thermocycler gen 2 status labels', () => {
    props = {
      data: mockThermocyclerGen2.data,
    }
    const { getByTestId } = render(props)
    expect(getByTestId('status_label+idle')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
  })
})
