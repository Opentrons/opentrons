import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { TemperatureModuleData } from '../TemperatureModuleData'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof TemperatureModuleData>) =>
  renderWithProviders(<TemperatureModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]

describe('TemperatureModuleData', () => {
  let props: ComponentProps<typeof TemperatureModuleData>
  beforeEach(() => {
    props = {
      moduleStatus: 'idle',
      targetTemp: null,
      currentTemp: 25,
    }
  })

  it('renders idle status with text and temperature info', () => {
    render(props)
    const container = screen.getByTestId('temp_module_data')

    screen.getByText('idle')
    screen.getByTestId(`Chip_neutral`)

    expect(
      screen.queryByTestId('Chip_neutral_icon_animate')
    ).not.toBeInTheDocument()

    expect(container).toHaveTextContent('Target: N/A °C')
    expect(container).toHaveTextContent(`Current: ${props.currentTemp} °C`)
  })

  it('renders holding at target status with text and temperature info', () => {
    props.moduleStatus = 'holding at target'
    props.targetTemp = 30
    render(props)
    const container = screen.getByTestId('temp_module_data')

    screen.getByText('holding at target')
    screen.getByTestId(`Chip_info`)

    expect(
      screen.queryByTestId('Chip_info_icon_animate')
    ).not.toBeInTheDocument()

    expect(container).toHaveTextContent(`Target: ${props.targetTemp} °C`)
    expect(container).toHaveTextContent(`Current: ${props.currentTemp} °C`)
  })

  it('renders cooling status with text and temperature info', () => {
    props.moduleStatus = 'cooling'
    render(props)
    const container = screen.getByTestId('temp_module_data')

    screen.getByText('cooling')
    screen.getByTestId(`Chip_info`)

    const pulsingIcon = screen.getByTestId('Chip_info_icon_animate')
    expect(pulsingIcon).toHaveAttribute('repeatCount', 'indefinite')

    expect(container).toHaveTextContent('Target: N/A °C')
    expect(container).toHaveTextContent(`Current: ${props.currentTemp} °C`)
  })

  it('renders heating status with text and temperature info', () => {
    props.moduleStatus = 'heating'
    render(props)
    const container = screen.getByTestId('temp_module_data')

    screen.getByText('heating')
    screen.getByTestId(`Chip_info`)

    const pulsingIcon = screen.getByTestId('Chip_info_icon_animate')
    expect(pulsingIcon).toHaveAttribute('repeatCount', 'indefinite')

    expect(container).toHaveTextContent('Target: N/A °C')
    expect(container).toHaveTextContent(`Current: ${props.currentTemp} °C`)
  })

  it('renders target temperature when available', () => {
    props.targetTemp = 37
    render(props)

    screen.getByText(`Target: ${props.targetTemp} °C`)
    screen.getByText(`Current: ${props.currentTemp} °C`)
  })
})
