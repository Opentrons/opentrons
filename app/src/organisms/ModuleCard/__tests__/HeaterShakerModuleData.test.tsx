import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { HeaterShakerModuleData } from '../HeaterShakerModuleData'

import type { ComponentProps } from 'react'
import type { ChipType } from '@opentrons/components'

const render = (props: ComponentProps<typeof HeaterShakerModuleData>) => {
  return renderWithProviders(<HeaterShakerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const getBackgroundColorByChipType = (chip: ChipType): string => {
  switch (chip) {
    case 'neutral':
      return `${COLORS.black90}${COLORS.opacity20HexCode}`
    case 'info':
      return `${COLORS.blue35}`
    case 'warning':
      return `${COLORS.yellow35}`
    default:
      return ''
  }
}

describe('HeaterShakerModuleData', () => {
  let props: ComponentProps<typeof HeaterShakerModuleData>
  beforeEach(() => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'idle',
        currentSpeed: null,
        currentTemperature: null,
        targetSpeed: null,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
      showTemperatureData: true,
    }
  })

  it('renders idle statuses', () => {
    render(props)

    const heaterInfo = screen.getByTestId('heater_shaker_module_data_temp')
    expect(heaterInfo).toHaveTextContent('Heater')
    expect(heaterInfo).toHaveTextContent('Target: N/A °C')
    expect(heaterInfo).toHaveTextContent('Current: °C')

    expect(heaterInfo).toHaveTextContent('idle')
    const tempChip = screen.getByTestId('tempStatus')
    expect(tempChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('neutral')}`
    )

    const shakerInfo = screen.getByTestId('heater_shaker_module_data_shaker')
    expect(shakerInfo).toHaveTextContent('Shaker')
    expect(shakerInfo).toHaveTextContent('Target: N/A RPM')
    expect(shakerInfo).toHaveTextContent('Current: 0 RPM')

    expect(shakerInfo).toHaveTextContent('idle')
    const shakerChip = screen.getByTestId('shakerStatus')
    expect(shakerChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('neutral')}`
    )

    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Open')
  })

  it('renders a holding at target status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'holding at target',
      currentSpeed: 200,
      currentTemperature: null,
      targetSpeed: 200,
      targetTemperature: null,
      errorDetails: null,
      status: 'idle',
    }
    render(props)

    const heaterInfo = screen.getByTestId('heater_shaker_module_data_temp')
    expect(heaterInfo).toHaveTextContent('Heater')
    expect(heaterInfo).toHaveTextContent('Target: N/A °C')
    expect(heaterInfo).toHaveTextContent('Current: °C')

    expect(heaterInfo).toHaveTextContent('holding at target')
    const tempChip = screen.getByTestId('tempStatus')
    expect(tempChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders a heating status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'heating',
      currentSpeed: null,
      currentTemperature: 39,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }
    render(props)
    const heaterInfo = screen.getByTestId('heater_shaker_module_data_temp')
    expect(heaterInfo).toHaveTextContent('Heater')
    expect(heaterInfo).toHaveTextContent('Target: 42 °C')
    expect(heaterInfo).toHaveTextContent('Current: 39 °C')

    expect(heaterInfo).toHaveTextContent('heating')
    const tempChip = screen.getByTestId('tempStatus')
    expect(tempChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders a shaking status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'speeding up',
      temperatureStatus: 'idle',
      currentSpeed: 200,
      currentTemperature: null,
      targetSpeed: 200,
      targetTemperature: null,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const shakerInfo = screen.getByTestId('heater_shaker_module_data_shaker')
    expect(shakerInfo).toHaveTextContent('Shaker')
    expect(shakerInfo).toHaveTextContent('Target: 200 RPM')
    expect(shakerInfo).toHaveTextContent('Current: 200 RPM')

    expect(shakerInfo).toHaveTextContent('speeding up')
    const shakerChip = screen.getByTestId('shakerStatus')
    expect(shakerChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders an idle shaking status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'idle',
      currentSpeed: 0,
      currentTemperature: null,
      targetSpeed: null,
      targetTemperature: null,
      errorDetails: null,
      status: 'idle',
    }
    render(props)
    const shakerInfo = screen.getByTestId('heater_shaker_module_data_shaker')
    expect(shakerInfo).toHaveTextContent('Shaker')
    expect(shakerInfo).toHaveTextContent('Target: N/A RPM')
    expect(shakerInfo).toHaveTextContent('Current: 0 RPM')

    expect(shakerInfo).toHaveTextContent('idle')
    const shakerChip = screen.getByTestId('shakerStatus')
    expect(shakerChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('neutral')}`
    )
  })

  it('renders an error shaking status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'error',
      temperatureStatus: 'idle',
      currentSpeed: 200,
      currentTemperature: null,
      targetSpeed: 200,
      targetTemperature: null,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const shakerInfo = screen.getByTestId('heater_shaker_module_data_shaker')
    expect(shakerInfo).toHaveTextContent('Shaker')
    expect(shakerInfo).toHaveTextContent('Target: 200 RPM')
    expect(shakerInfo).toHaveTextContent('Current: 200 RPM')

    expect(shakerInfo).toHaveTextContent('error')
    const shakerChip = screen.getByTestId('shakerStatus')
    expect(shakerChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('warning')}`
    )
  })

  it('renders an idle temperature status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'idle',
      currentSpeed: 0,
      currentTemperature: null,
      targetSpeed: null,
      targetTemperature: null,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const heaterInfo = screen.getByTestId('heater_shaker_module_data_temp')

    expect(heaterInfo).toHaveTextContent('idle')
    const tempChip = screen.getByTestId('tempStatus')
    expect(tempChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('neutral')}`
    )
  })

  it('renders a cooling temp status', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'cooling',
      currentSpeed: null,
      currentTemperature: 60,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const heaterInfo = screen.getByTestId('heater_shaker_module_data_temp')

    expect(heaterInfo).toHaveTextContent('cooling')
    const tempChip = screen.getByTestId('tempStatus')
    expect(tempChip).toHaveStyle(
      `background-color: ${getBackgroundColorByChipType('info')}`
    )
  })

  it('renders a correct text when latch is opened', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_open',
      speedStatus: 'idle',
      temperatureStatus: 'cooling',
      currentSpeed: null,
      currentTemperature: 60,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Open')
  })

  it('renders a correct text when latch is opening', () => {
    props.moduleData = {
      labwareLatchStatus: 'opening',
      speedStatus: 'idle',
      temperatureStatus: 'cooling',
      currentSpeed: null,
      currentTemperature: 60,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }

    render(props)
    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Open')
  })

  it('renders a correct text when latch is unknown', () => {
    props.moduleData = {
      labwareLatchStatus: 'idle_unknown',
      speedStatus: 'idle',
      temperatureStatus: 'cooling',
      currentSpeed: null,
      currentTemperature: 60,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }
    render(props)
    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Open')
  })

  it('renders a correct text when latch is closing and is not shaking', () => {
    props.moduleData = {
      labwareLatchStatus: 'closing',
      speedStatus: 'idle',
      temperatureStatus: 'cooling',
      currentSpeed: null,
      currentTemperature: 60,
      targetSpeed: null,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }
    render(props)
    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Closed')
  })

  it('renders a correct text when latch is closing and is shaking', () => {
    props.moduleData = {
      labwareLatchStatus: 'closing',
      speedStatus: 'speeding up',
      temperatureStatus: 'cooling',
      currentSpeed: 200,
      currentTemperature: 60,
      targetSpeed: 500,
      targetTemperature: 42,
      errorDetails: null,
      status: 'idle',
    }
    render(props)
    const latchInfo = screen.getByTestId('heater_shaker_module_data_latch')
    expect(latchInfo).toHaveTextContent('Labware Latch')
    expect(latchInfo).toHaveTextContent('Closed and Locked')
  })
})
