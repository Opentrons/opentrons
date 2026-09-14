import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { FlexStackerModuleData } from '../FlexStackerModuleData'

import type { ComponentProps } from 'react'
import type { FlexStackerModule } from '@opentrons/api-client'

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

    const doorChip = screen.getByTestId('stacker_door_label')
    expect(doorChip).toHaveTextContent('Closed')
    expect(doorChip).toHaveStyle(
      `background-color: ${COLORS.black90}${COLORS.opacity20HexCode}`
    )

    const shuttleChip = screen.getByTestId('stacker_shuttle_label')
    expect(shuttleChip).toHaveTextContent('Extended')
    expect(shuttleChip).toHaveStyle(`background-color: ${COLORS.blue30}`)
  })

  it('applies correct styles for door when opened', () => {
    props.moduleData.hopperDoorState = 'opened'
    render(props)
    const doorChip = screen.getByTestId('stacker_door_label')
    expect(doorChip).toHaveTextContent('Open')
    expect(doorChip).toHaveStyle(`background-color: ${COLORS.blue30}`)
  })

  it('applies correct styles for shuttle when retracted', () => {
    props.moduleData.platformState = 'retracted'
    render(props)
    const shuttleChip = screen.getByTestId('stacker_shuttle_label')
    expect(shuttleChip).toHaveTextContent('In stacker')
    expect(shuttleChip).toHaveStyle(`background-color: ${COLORS.blue30}`)
  })

  it('applies correct styles for shuttle when missing', () => {
    props.moduleData.platformState = 'missing'
    render(props)
    const shuttleChip = screen.getByTestId('stacker_shuttle_label')
    expect(shuttleChip).toHaveTextContent('Missing')
    expect(shuttleChip).toHaveStyle(`background-color: ${COLORS.red30}`)
  })
})
