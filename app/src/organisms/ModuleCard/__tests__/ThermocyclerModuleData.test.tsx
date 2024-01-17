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

  it('renders an idle block temp status', () => {
    const { getByTestId } = render(props)

    expect(getByTestId('status_label_idle_blockStatus')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
  })

  it('renders a block temp holding at target status', () => {
    props = {
      data: mockDataHoldingAtTarget,
    }
    const { getByTestId } = render(props)

    expect(
      getByTestId('status_label_holding at target_blockStatus')
    ).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders a block temp cooling status', () => {
    props = {
      data: mockDataCooling,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label_cooling_blockStatus')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a block temp heating status', () => {
    props = {
      data: mockDataHeating,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label_heating_blockStatus')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders an error status', () => {
    props = {
      data: mockDataHeating,
    }
    const { getByTestId } = render(props)

    expect(getByTestId('status_label_heating_blockStatus')).toHaveStyle(
      'backgroundColor: COLORS.yellow20'
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid opened', () => {
    const { getByText, getByTitle, getByTestId } = render(props)

    getByText('Lid')
    getByTitle('lid_target_temp')
    getByTitle('lid_temp')
    getByTestId('status_label_open_lidStatus')
  })

  it('renders thermocycler gen 1 lid temperature data with lid closed', () => {
    props = {
      data: {
        lidStatus: 'closed',
        lidTargetTemperature: null,
        lidTemperatureStatus: 'idle',
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
    getByTestId('status_label_closed_lidStatus')
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status cooling', () => {
    props = {
      data: {
        lidTemperatureStatus: 'cooling',
      } as ThermocyclerData,
    }
    const { getByTestId } = render(props)
    expect(getByTestId('status_label_cooling_lidTempStatus')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status heating', () => {
    props = {
      data: {
        lidTemperatureStatus: 'heating',
      } as ThermocyclerData,
    }
    const { getByTestId } = render(props)
    expect(getByTestId('status_label_heating_lidTempStatus')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status holding at temperature', () => {
    props = {
      data: {
        lidTemperatureStatus: 'holding at target',
      } as ThermocyclerData,
    }
    const { getByTestId } = render(props)
    expect(
      getByTestId('status_label_holding at target_lidTempStatus')
    ).toHaveStyle('backgroundColor: C_SKY_BLUE')
  })

  it('renders thermocycler gen 1 block temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Block')
    getByTitle('tc_target_temp')
    getByTitle('tc_current_temp')
  })

  it('renders all 3 of the thermocycler gen 2 status labels', () => {
    props = {
      data: mockThermocyclerGen2.data,
    }
    const { getByTestId } = render(props)
    expect(getByTestId('status_label_open_lidStatus')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
    expect(getByTestId('status_label_idle_lidTempStatus')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
    expect(getByTestId('status_label_idle_blockStatus')).toHaveStyle(
      'backgroundColor: C_SILVER_GRAY'
    )
  })

  it('renders thermocycler lid status to say open even though the status is in_between', () => {
    props = {
      data: {
        lidStatus: 'in_between',
      } as ThermocyclerData,
    }
    const { getByTestId } = render(props)
    getByTestId('status_label_open_lidStatus')
  })
})
