import * as React from 'react'
import { describe, it, beforeEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'

import { SlotInformation } from '..'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

const mockLiquids = ['Mastermix', 'Ethanol', 'Water']
const mockLabwares = ['96 Well Plate', 'Adapter']
const mockModules = ['Thermocycler Module Gen2', 'Heater-Shaker Module']

const render = (props: React.ComponentProps<typeof SlotInformation>) => {
  return renderWithProviders(<SlotInformation {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SlotInformation', () => {
  let props: React.ComponentProps<typeof SlotInformation>

  beforeEach(() => {
    props = {
      robotType: FLEX_ROBOT_TYPE,
      location: 'A1',
      liquids: [],
      labwares: [],
      modules: [],
      fixtures: [],
    }
  })

  it('should render DeckInfoLabel and title', () => {
    render(props)
    screen.getByText('A1')
    screen.getByText('Slot Stack Information')
  })

  it('should render liquid, labware, and module', () => {
    render(props)
    screen.getByText('Liquid')
    screen.getByText('Labware')
    screen.getByText('Module')
    expect(screen.getAllByText('None').length).toBe(3)
  })

  it('should render info of liquid, labware, and module', () => {
    props = {
      ...props,
      liquids: mockLiquids,
      labwares: mockLabwares,
      modules: mockModules,
    }
    render(props)
    expect(screen.getAllByText('Liquid').length).toBe(mockLiquids.length)
    expect(screen.getAllByText('Labware').length).toBe(mockLabwares.length)
    expect(screen.getAllByText('Module').length).toBe(mockModules.length)
    screen.getByText('Mastermix')
    screen.getByText('Ethanol')
    screen.getByText('Water')
    screen.getByText('96 Well Plate')
    screen.getByText('Adapter')
    screen.getByText('Thermocycler Module Gen2')
    screen.getByText('Heater-Shaker Module')
  })
})
