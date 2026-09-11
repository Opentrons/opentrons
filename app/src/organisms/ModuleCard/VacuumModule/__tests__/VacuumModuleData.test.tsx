import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { VacuumModuleData } from '../VacuumModuleData'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof VacuumModuleData>) => {
  return renderWithProviders(<VacuumModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('VacuumModuleData', () => {
  let props: ComponentProps<typeof VacuumModuleData>

  beforeEach(() => {
    props = {
      moduleData: {
        currentPressure: null,
        targetPressure: null,
        currentPower: null,
        targetPower: null,
        modeType: 'pressure',
        ventStatus: 'closed',
        status: 'idle',
      },
    }
  })

  it('renders vacuum pump label and idle status', () => {
    render(props)

    expect(screen.getByText('Vacuum Pump')).toBeInTheDocument()
    expect(screen.getByText('Idle')).toBeInTheDocument()
  })

  it('renders vent section with closed status', () => {
    render(props)

    expect(screen.getByText('Vent')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('renders vent section with open status', () => {
    props.moduleData.ventStatus = 'opened'
    render(props)

    expect(screen.getByText('Vent')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders N/A for current and target pressure when values are null in pressure mode', () => {
    render(props)

    expect(screen.getByText('Current: N/A')).toBeInTheDocument()
    expect(screen.getByText('Target: N/A')).toBeInTheDocument()
  })

  it('renders current and target pressure values in pressure mode', () => {
    props.moduleData.currentPressure = -500
    props.moduleData.targetPressure = -600
    render(props)

    expect(screen.getByText('Current: -500 mbar')).toBeInTheDocument()
    expect(screen.getByText('Target: -600 mbar')).toBeInTheDocument()
  })

  it('displays N/A when pressure is within atmospheric tolerance', () => {
    props.moduleData.currentPressure = -5.2
    props.moduleData.targetPressure = 0
    render(props)

    expect(screen.getByText('Current: N/A')).toBeInTheDocument()
    expect(screen.getByText('Target: N/A')).toBeInTheDocument()
  })

  it('rounds current pressure to one decimal outside atmospheric tolerance', () => {
    props.moduleData.currentPressure = -12.34
    props.moduleData.targetPressure = -300
    render(props)

    expect(screen.getByText('Current: -12.3 mbar')).toBeInTheDocument()
    expect(screen.getByText('Target: -300 mbar')).toBeInTheDocument()
  })

  it('renders N/A for current and target power when values are null in power mode', () => {
    props.moduleData.modeType = 'power'
    render(props)

    expect(screen.getByText('Current: N/A')).toBeInTheDocument()
    expect(screen.getByText('Target: N/A')).toBeInTheDocument()
  })

  it('renders current and target power values in power mode', () => {
    props.moduleData.modeType = 'power'
    props.moduleData.currentPower = 75
    props.moduleData.targetPower = 100
    render(props)

    expect(screen.getByText('Current: 75%')).toBeInTheDocument()
    expect(screen.getByText('Target: 100%')).toBeInTheDocument()
  })

  it('renders engaged status when pump is ramping', () => {
    props.moduleData.status = 'ramping'
    render(props)

    expect(screen.getByText('Engaged')).toBeInTheDocument()
  })

  it('renders engaged status when pump is holding', () => {
    props.moduleData.status = 'holding'
    render(props)

    expect(screen.getByText('Engaged')).toBeInTheDocument()
  })

  it('renders engaged status when pump is venting', () => {
    props.moduleData.status = 'venting'
    render(props)

    expect(screen.getByText('Engaged')).toBeInTheDocument()
  })

  it('renders engaged status when pump is complete', () => {
    props.moduleData.status = 'complete'
    render(props)

    expect(screen.getByText('Engaged')).toBeInTheDocument()
  })

  it('renders engaged status when pump is in error', () => {
    props.moduleData.status = 'error'
    render(props)

    expect(screen.getByText('Error')).toBeInTheDocument()
  })
})
