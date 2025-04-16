import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { FlexStackerModuleData } from '../FlexStackerModuleData'

import type { ComponentProps } from 'react'
import type { FlexStackerModule } from '/app/redux/modules/types'

const render = (props: ComponentProps<typeof FlexStackerModuleData>) => {
  return renderWithProviders(<FlexStackerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FlexStackerModuleData', () => {
  let props: ComponentProps<typeof FlexStackerModuleData>

  beforeEach(() => {
    props = {
      moduleData: {
        platformState: 'extended',
        hopperDoorState: 'closed',
      } as FlexStackerModule['data'],
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders both door and shuttle statuses', () => {
    render(props)
    screen.getByTestId('stacker_door_data')
    screen.getByTestId('stacker_shuttle_data')

    const doorLabel = screen.getByText('Closed')
    expect(doorLabel).toHaveStyle('backgroundColor: COLORS.grey30')

    const shuttleLabel = screen.getByText('Extended')
    expect(shuttleLabel).toHaveStyle('backgroundColor: COLORS.blue30')
  })

  it('applies correct styles for door when opened', () => {
    props.moduleData.hopperDoorState = 'opened'
    render(props)
    const doorLabel = screen.getByText('Open')
    expect(doorLabel).toHaveStyle('backgroundColor: COLORS.grey30')
  })

  it('applies correct styles for shuttle when retracted', () => {
    props.moduleData.platformState = 'retracted'
    render(props)
    const shuttleLabel = screen.getByText('In stacker')
    expect(shuttleLabel).toHaveStyle('backgroundColor: COLORS.blue30')
  })

  it('applies correct styles for shuttle when missing', () => {
    props.moduleData.platformState = 'missing'
    render(props)
    const shuttleLabel = screen.getByText('Unknown')
    expect(shuttleLabel).toHaveStyle('backgroundColor: COLORS.red30')
  })
})
