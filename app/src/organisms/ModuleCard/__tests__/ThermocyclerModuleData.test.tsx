import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  mockThermocycler,
  mockThermocyclerGen2,
} from '/app/redux/modules/__fixtures__'

import { ThermocyclerModuleData } from '../ThermocyclerModuleData'

import type { ComponentProps } from 'react'
import type { ChipType } from '@opentrons/components'
import type { ThermocyclerData } from '@opentrons/api-client'

const render = (props: ComponentProps<typeof ThermocyclerModuleData>) => {
  return renderWithProviders(<ThermocyclerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const getBackgroundColorByChipType = (chip: ChipType): string => {
  switch (chip) {
    case 'neutral':
      return `${COLORS.black90}${COLORS.opacity20HexCode}`
    case 'info':
      return `${COLORS.blue30}`
    case 'warning':
      return `${COLORS.yellow30}`
    default:
      return ''
  }
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
  let props: ComponentProps<typeof ThermocyclerModuleData>
  beforeEach(() => {
    props = {
      data: mockThermocycler.data,
    }
  })

  it('renders an idle block temp status', () => {
    render(props)

    const blockInfo = screen.getByTestId('thermocycler_module_data_block')
    expect(blockInfo).toHaveTextContent('Block')
    expect(blockInfo).toHaveTextContent('idle')
    expect(screen.getByTestId('blockStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('neutral')}`
    )
  })

  it('renders a block temp holding at target status', () => {
    props = {
      data: mockDataHoldingAtTarget,
    }
    render(props)

    const blockInfo = screen.getByTestId('thermocycler_module_data_block')
    expect(blockInfo).toHaveTextContent('Block')
    expect(blockInfo).toHaveTextContent('holding at target')
    expect(screen.getByTestId('blockStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders a block temp cooling status', () => {
    props = {
      data: mockDataCooling,
    }
    render(props)

    const blockInfo = screen.getByTestId('thermocycler_module_data_block')
    expect(blockInfo).toHaveTextContent('Block')
    expect(blockInfo).toHaveTextContent('cooling')
    expect(screen.getByTestId('blockStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders a block temp heating status', () => {
    props = {
      data: mockDataHeating,
    }
    render(props)

    const blockInfo = screen.getByTestId('thermocycler_module_data_block')
    expect(blockInfo).toHaveTextContent('Block')
    expect(blockInfo).toHaveTextContent('heating')
    expect(screen.getByTestId('blockStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders an error status', () => {
    props.data.status = 'error'
    render(props)

    const blockInfo = screen.getByTestId('thermocycler_module_data_block')
    expect(blockInfo).toHaveTextContent('Block')
    expect(blockInfo).toHaveTextContent('error')
    expect(screen.getByTestId('blockStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('warning')}`
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid opened', () => {
    render(props)

    screen.getByText('Lid')
    screen.getByTitle('lid_target_temp')
    screen.getByTitle('lid_temp')
    screen.getByTestId('lidTempStatus')
    screen.getByText('open')
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
    render(props)

    screen.getByText('Lid')
    screen.getByTitle('lid_target_temp')
    screen.getByTitle('lid_temp')
    screen.getByTestId('lidTempStatus')
    screen.getByText('closed')
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status cooling', () => {
    props = {
      data: {
        lidTemperatureStatus: 'cooling',
      } as ThermocyclerData,
    }
    render(props)
    const lidData = screen.getByTestId('thermocycler_module_data_lid')
    expect(lidData).toHaveTextContent('cooling')
    expect(screen.getByTestId('lidTempStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status heating', () => {
    props = {
      data: {
        lidTemperatureStatus: 'heating',
      } as ThermocyclerData,
    }
    render(props)
    const lidData = screen.getByTestId('thermocycler_module_data_lid')
    expect(lidData).toHaveTextContent('heating')
    expect(screen.getByTestId('lidTempStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders thermocycler gen 1 lid temperature data with lid temp status holding at temperature', () => {
    props = {
      data: {
        lidTemperatureStatus: 'holding at target',
      } as ThermocyclerData,
    }
    render(props)
    const lidData = screen.getByTestId('thermocycler_module_data_lid')
    expect(lidData).toHaveTextContent('holding at target')
    expect(screen.getByTestId('lidTempStatus')).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders thermocycler gen 1 block temperature data', () => {
    render(props)

    screen.getByTestId('thermocycler_module_data_block')
    screen.getByTitle('tc_target_temp')
    screen.getByTitle('tc_current_temp')
  })

  it('renders all 3 of the thermocycler gen 2 status labels', () => {
    props = {
      data: mockThermocyclerGen2.data,
    }
    render(props)
    screen.getByTestId('lidStatus')
    screen.getByTestId('lidTempStatus')
    screen.getByTestId('blockStatus')
  })

  it('renders thermocycler lid status to say open even though the status is in_between', () => {
    props = {
      data: {
        lidStatus: 'in_between',
      } as ThermocyclerData,
    }
    render(props)
    const lidStats = screen.getByTestId('lidStatus')
    expect(lidStats).toHaveTextContent('open')
  })
})
