import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { Ot2ModuleTag } from '../Ot2ModuleTag'
import type { ModuleDimensions } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof Ot2ModuleTag>) => {
  return renderWithProviders(<Ot2ModuleTag {...props} />)[0]
}

const mockDimensions: ModuleDimensions = {
  labwareInterfaceXDimension: 5,
} as any

describe('Ot2ModuleTag', () => {
  it('renders module tag for left magnetic module', () => {
    render({
      dimensions: mockDimensions,
      orientation: 'left',
      model: 'magneticModuleV1',
    })
    screen.getByText('Magnetic Module GEN1')
  })
  it('renders module tag for right heater-shaker', () => {
    render({
      dimensions: mockDimensions,
      orientation: 'right',
      model: 'heaterShakerModuleV1',
    })
    screen.getByText('Heater-Shaker Module GEN1')
  })
  it('renders module tag for thermocycler', () => {
    render({
      dimensions: mockDimensions,
      orientation: 'left',
      model: 'thermocyclerModuleV1',
    })
    screen.getByText('Thermocycler Module GEN1')
  })
})
