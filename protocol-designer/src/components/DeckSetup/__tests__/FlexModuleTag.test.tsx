import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi } from 'vitest'
import {
  renderWithProviders,
} from '../../../__testing-utils__'
import { FlexModuleTag } from '../FlexModuleTag'
import type { ModuleDimensions } from '@opentrons/shared-data'

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    RobotCoordsForeignDiv: ({children}: {children: React.ReactNode}) => <div>{children}</div>
  }
})

const render = (props: React.ComponentProps<typeof FlexModuleTag>) => {
  return renderWithProviders(<FlexModuleTag {...props} />)[0]
}

const mockDimensions: ModuleDimensions = {
  labwareInterfaceXDimension: 5,
} as any

describe('FlexModuleTag', () => {
  it('renders the flex module tag for magnetic block', () => {
    render({
      dimensions: mockDimensions,
      displayName: 'mock Magnetic Block',
    })
    screen.getByText('mock Magnetic Block')
  })
  it('renders the flex module tag for heater-shaker', () => {
    render({
      dimensions: mockDimensions,
      displayName: 'mock Heater-shaker',
    })
    screen.getByText('mock Heater-shaker')
  })
})
