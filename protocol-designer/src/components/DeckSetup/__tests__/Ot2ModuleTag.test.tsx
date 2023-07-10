import * as React from 'react'
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
    const { getByText } = render({
      dimensions: mockDimensions,
      orientation: 'left',
      model: 'magneticModuleV1',
    })
    getByText('Magnetic Module GEN1')
  })
  it('renders module tag for right heater-shaker', () => {
    const { getByText } = render({
      dimensions: mockDimensions,
      orientation: 'right',
      model: 'heaterShakerModuleV1',
    })
    getByText('Heater-Shaker Module GEN1')
  })
  it('renders module tag for thermocycler', () => {
    const { getByText } = render({
      dimensions: mockDimensions,
      orientation: 'left',
      model: 'thermocyclerModuleV1',
    })
    getByText('Thermocycler Module GEN1')
  })
})
